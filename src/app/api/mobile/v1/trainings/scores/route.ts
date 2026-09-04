import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import {
  calculateTrainingScores,
  MobileScoresInputError,
  MAX_EXERCISES_PER_REQUEST,
} from "@/mobile/scores";

const approachSchema = z.object({
  weight: z.number().finite().min(0),
  count: z.number().int().positive(),
  priority: z.number().int().min(0).optional(),
  isBoost: z.boolean().optional(),
});

const exercisesSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    purpose: z.enum(["MASS", "STRENGTH", "LOSS"]),
    approaches: z.array(approachSchema).min(1),
  }),
);

// корень схемы — объект, чтобы в сообщениях об ошибках был путь от поля `exercises`
const bodySchema = z.object({ exercises: exercisesSchema });

/** «exercises[0].approaches[1].weight: Expected number, received string» */
function formatValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.reduce<string>(
    (acc, segment) =>
      typeof segment === "number"
        ? `${acc}[${segment}]`
        : acc
          ? `${acc}.${segment}`
          : `${segment}`,
    "",
  );
  return path ? `${path}: ${issue.message}` : issue.message;
}

// POST /api/mobile/v1/trainings/scores
// Body: { "exercises": [ { "id": 42, "purpose": "MASS", "approaches": [ { "weight": 60, "count": 10 } ] } ] }
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
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.exercises)) {
      return NextResponse.json(
        { error: "Request body must contain an 'exercises' array" },
        { status: 400 },
      );
    }
    if (body.exercises.length === 0) {
      return NextResponse.json(
        { error: "exercises array must not be empty" },
        { status: 400 },
      );
    }
    if (body.exercises.length > MAX_EXERCISES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EXERCISES_PER_REQUEST} exercises per request` },
        { status: 413 },
      );
    }

    const parsed = bodySchema.safeParse({ exercises: body.exercises });
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await calculateTrainingScores(
      payload.userId,
      parsed.data.exercises,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MobileScoresInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Mobile training scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
