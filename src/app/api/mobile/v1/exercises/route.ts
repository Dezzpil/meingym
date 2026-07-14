import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { getExercisesList } from "@/mobile/exercises";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;

    if (cursorParam && (isNaN(cursor!) || cursor! < 0)) {
      return NextResponse.json({ error: "cursor must be a positive integer" }, { status: 400 });
    }

    const result = await getExercisesList(cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile exercises list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
