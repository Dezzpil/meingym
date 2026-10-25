import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { getCheckupForTraining } from "@/mobile/checkup";

// GET /api/mobile/v1/checkup/[trainingId]
export async function GET(
  request: NextRequest,
  { params }: { params: { trainingId: string } },
) {
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

    const trainingId = parseInt(params.trainingId, 10);
    if (isNaN(trainingId) || trainingId <= 0) {
      return NextResponse.json(
        { error: "trainingId must be a positive integer" },
        { status: 400 },
      );
    }

    const checkup = await getCheckupForTraining(payload.userId, trainingId);
    if (!checkup) {
      return NextResponse.json({ error: "Checkup not found" }, { status: 404 });
    }

    return NextResponse.json(checkup);
  } catch (error) {
    console.error("Mobile checkup get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
