import { NextRequest, NextResponse } from "next/server";
import { registerMobileUser } from "@/mobile/register";
import { MobileAuthError } from "@/mobile/exchange";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, timestamp, signature, name, appToken } = body;

    const expectedAppToken = process.env.MOBILE_APP_TOKEN;
    const providedAppToken = request.headers.get("x-app-token") || appToken;
    if (!expectedAppToken || providedAppToken !== expectedAppToken) {
      return NextResponse.json({ error: "INVALID_APP_TOKEN" }, { status: 403 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!timestamp || typeof timestamp !== "number") {
      return NextResponse.json({ error: "timestamp is required and must be a number" }, { status: 400 });
    }
    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ error: "signature is required" }, { status: 400 });
    }
    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    }

    const result = await registerMobileUser(email, timestamp, signature, name);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      if (error.code === "USER_ALREADY_EXISTS") {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
      const status = error.code === "TIMESTAMP_EXPIRED" || error.code === "INVALID_SIGNATURE" ? 401 : 500;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error("Mobile auth register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
