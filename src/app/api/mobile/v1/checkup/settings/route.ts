import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import {
  getCheckupSettings,
  updateCheckupSettings,
} from "@/mobile/checkup";

// GET /api/mobile/v1/checkup/settings
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

    const settings = await getCheckupSettings(payload.userId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Mobile checkup settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/mobile/v1/checkup/settings
export async function PUT(request: NextRequest) {
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

    if (
      body.checkupsEnabled !== undefined &&
      typeof body.checkupsEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "checkupsEnabled must be a boolean" },
        { status: 400 },
      );
    }

    if (body.isEmployed !== undefined && typeof body.isEmployed !== "boolean") {
      return NextResponse.json(
        { error: "isEmployed must be a boolean" },
        { status: 400 },
      );
    }

    const settings = await updateCheckupSettings(payload.userId, {
      checkupsEnabled: body.checkupsEnabled,
      isEmployed: body.isEmployed,
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Mobile checkup settings PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
