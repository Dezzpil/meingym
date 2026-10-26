import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { prisma } from "@/tools/db";
import { computeBatchDynamics } from "@/core/dynamics";
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
    
    const sinceParam = searchParams.get("since");
    const limitParam = searchParams.get("limit");

    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const limit = limitParam ? z.number().int().positive().max(100).parse(Number(limitParam)) : 50;

    if (isNaN(since.getTime())) {
      return NextResponse.json(
        { error: "since must be a valid ISO 8601 datetime" },
        { status: 400 },
      );
    }

    const trainings = await prisma.training.findMany({
      where: {
        userId,
        plannedTo: { gte: since },
      },
      select: {
        id: true,
        difficultyScore: true,
        muscleSignature: true,
        plannedTo: true,
      },
      orderBy: { plannedTo: "desc" },
      take: limit,
    });

    const dynamicsMap = computeBatchDynamics(trainings);
    const dynamics = trainings.map((t) => dynamicsMap.get(t.id)!);

    return NextResponse.json({
      data: dynamics,
      meta: {
        total: dynamics.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "limit must be a positive integer up to 100" },
        { status: 400 },
      );
    }
    console.error("Error in GET /trainings/dynamics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
