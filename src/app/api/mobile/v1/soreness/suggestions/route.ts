import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { findUnderLoadedMuscles } from "@/core/soreness";
import { z } from "zod";

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

    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const trainingIdParam = searchParams.get("trainingId");

    if (!trainingIdParam) {
      return NextResponse.json(
        { error: "trainingId query parameter is required" },
        { status: 400 },
      );
    }

    const trainingId = z.number().int().positive().parse(Number(trainingIdParam));
    const result = await findUnderLoadedMuscles(userId, trainingId);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "trainingId must be a positive integer" },
        { status: 400 },
      );
    }
    console.error("Error in GET /soreness/suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
