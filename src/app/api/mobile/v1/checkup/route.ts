import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import {
  getCheckupList,
  createCheckup,
  type MobileCheckupInput,
} from "@/mobile/checkup";
import { DifficultyChoice } from "@prisma/client";

// GET /api/mobile/v1/checkup?cursor=<int>
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header with Bearer token is required" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;
    if (cursorParam && (isNaN(cursor!) || cursor! < 0)) {
      return NextResponse.json(
        { error: "cursor must be a positive integer" },
        { status: 400 },
      );
    }

    const result = await getCheckupList(payload.userId, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile checkup list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/mobile/v1/checkup
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header with Bearer token is required" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 },
      );
    }

    const input = validateCheckupInput(body);
    if (!input.valid) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const result = await createCheckup(payload.userId, input.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile checkup create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function validateCheckupInput(body: any):
  | { valid: true; data: MobileCheckupInput }
  | { valid: false; error: string } {
  if (typeof body.trainingId !== "number" || body.trainingId <= 0) {
    return { valid: false, error: "trainingId must be a positive integer" };
  }

  const intFields = ["sleep", "nutrition", "preWorkout", "stress"] as const;
  for (const field of intFields) {
    if (
      typeof body[field] !== "number" ||
      body[field] < 1 ||
      body[field] > 5
    ) {
      return {
        valid: false,
        error: `${field} must be an integer between 1 and 5`,
      };
    }
  }

  const burnoutFields = [
    "burnoutExhaustion",
    "burnoutDistance",
    "burnoutCognitive",
    "burnoutEmotional",
  ] as const;
  for (const field of burnoutFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      (typeof body[field] !== "number" ||
        body[field] < 1 ||
        body[field] > 5)
    ) {
      return {
        valid: false,
        error: `${field} must be an integer between 1 and 5 or null`,
      };
    }
  }

  if (
    body.difficultyChoice !== undefined &&
    body.difficultyChoice !== null &&
    !Object.values(DifficultyChoice).includes(body.difficultyChoice)
  ) {
    return {
      valid: false,
      error: `difficultyChoice must be one of: ${Object.values(DifficultyChoice).join(", ")}`,
    };
  }

  return {
    valid: true,
    data: {
      trainingId: body.trainingId,
      sleep: body.sleep,
      nutrition: body.nutrition,
      preWorkout: body.preWorkout,
      stress: body.stress,
      burnoutExhaustion: body.burnoutExhaustion ?? null,
      burnoutDistance: body.burnoutDistance ?? null,
      burnoutCognitive: body.burnoutCognitive ?? null,
      burnoutEmotional: body.burnoutEmotional ?? null,
      difficultyChoice: body.difficultyChoice ?? null,
    },
  };
}
