import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { getTrainingsList } from "@/mobile/trainings";

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
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;
    if (cursorParam && (isNaN(cursor!) || cursor! < 0)) {
      return NextResponse.json({ error: "cursor must be a positive integer" }, { status: 400 });
    }

    const sinceParam = searchParams.get("since");
    const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    let since: Date;

    if (!sinceParam) {
      since = oneMonthAgo;
    } else {
      since = new Date(sinceParam);
      if (isNaN(since.getTime())) {
        return NextResponse.json(
          { error: "since must be a valid ISO 8601 datetime" },
          { status: 400 },
        );
      }
      if (since < oneMonthAgo) {
        return NextResponse.json(
          { error: "since must not be older than 1 month" },
          { status: 400 },
        );
      }
    }

    const result = await getTrainingsList(payload.userId, since, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile trainings list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
