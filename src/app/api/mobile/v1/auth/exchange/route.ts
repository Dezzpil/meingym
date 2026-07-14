import { NextRequest, NextResponse } from "next/server";
import { exchangeForToken, MobileAuthError } from "@/mobile/exchange";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, timestamp, signature } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!timestamp || typeof timestamp !== "number") {
      return NextResponse.json({ error: "timestamp is required and must be a number" }, { status: 400 });
    }
    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ error: "signature is required" }, { status: 400 });
    }

    const result = await exchangeForToken(email, timestamp, signature);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      const status =
        error.code === "TIMESTAMP_EXPIRED" || error.code === "INVALID_SIGNATURE" || error.code === "USER_NOT_FOUND"
          ? 401
          : 500;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error("Mobile auth exchange error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
