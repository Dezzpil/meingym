import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/tools/db";
import { hashPassword } from "@/tools/password";
import { setupNewUser } from "@/tools/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, csrfToken } = body;

    // 1. CSRF validation (double-submit cookie pattern)
    const cookieStore = cookies();
    const csrfCookie = cookieStore.get("next-auth.csrf-token");
    const csrfTokenFromCookie = csrfCookie?.value?.split("|")[0];
    if (!csrfTokenFromCookie || csrfTokenFromCookie !== csrfToken) {
      return NextResponse.json({ error: "CSRF token mismatch" }, { status: 403 });
    }

    // 2. Input validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Пароль обязателен" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Некорректный формат email" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 },
      );
    }
    if (!/[a-zA-Zа-яА-Я]/.test(password)) {
      return NextResponse.json(
        { error: "Пароль должен содержать буквы" },
        { status: 400 },
      );
    }
    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: "Пароль должен содержать цифры" },
        { status: 400 },
      );
    }

    // 3. Email uniqueness check
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 409 },
      );
    }

    // 4. Hash password + create user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, password: hashedPassword },
      });
      await setupNewUser(createdUser.id, tx);
      return createdUser;
    });

    // 5. Return success
    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
