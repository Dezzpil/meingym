import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { getWeightsList, createWeightsBatch, MAX_BATCH_SIZE } from "@/mobile/weights";

// GET /api/mobile/v1/weights?cursor=<int>&since=<ISO8601>
export async function GET(request: NextRequest) {
  try {
    // --- Auth (identical to trainings route lines 8-20) ---
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

    // --- Parse cursor (identical to trainings route lines 24-28) ---
    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? parseInt(cursorParam, 10) : undefined;
    if (cursorParam && (isNaN(cursor!) || cursor! < 0)) {
      return NextResponse.json({ error: "cursor must be a positive integer" }, { status: 400 });
    }

    // --- Parse since (same pattern as trainings route lines 30-50, but NO 1-month cap) ---
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
      // No upper/lower bound cap — weights are valuable long-term
    }

    const result = await getWeightsList(payload.userId, since, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile weights list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/mobile/v1/weights
// Body: { "weights": [ { "value": 75.5, "createdAt": "2026-08-09T10:00:00.000Z" }, ... ] }
export async function POST(request: NextRequest) {
  try {
    // --- Auth (identical to trainings POST lines 62-74) ---
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

    // --- Validate body (same pattern as trainings POST lines 76-94) ---
    const body = await request.json();
    if (!body || !Array.isArray(body.weights)) {
      return NextResponse.json(
        { error: "Request body must contain a 'weights' array" },
        { status: 400 },
      );
    }
    if (body.weights.length === 0) {
      return NextResponse.json(
        { error: "weights array must not be empty" },
        { status: 400 },
      );
    }
    if (body.weights.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} weights per request` },
        { status: 413 },
      );
    }

    // --- Validate each weight item ---
    for (let i = 0; i < body.weights.length; i++) {
      const w = body.weights[i];
      if (typeof w.value !== "number" || !Number.isFinite(w.value) || w.value <= 0) {
        return NextResponse.json(
          { error: `weights[${i}].value must be a positive finite number` },
          { status: 400 },
        );
      }
      if (w.createdAt !== undefined) {
        const parsed = new Date(w.createdAt);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: `weights[${i}].createdAt must be a valid ISO 8601 datetime` },
            { status: 400 },
          );
        }
        if (parsed > new Date()) {
          return NextResponse.json(
            { error: `weights[${i}].createdAt must not be in the future` },
            { status: 400 },
          );
        }
      }
    }

    // --- Delegate to domain logic ---
    const result = await createWeightsBatch(payload.userId, body.weights);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile weights batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
