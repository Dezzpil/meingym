import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { prisma } from "@/tools/db";
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
        plannedTo: true,
      },
      orderBy: { plannedTo: "desc" },
      take: limit,
    });

    const trainingIds = trainings.map((t) => t.id);

    const muscleLoads = await prisma.trainingMuscleLoad.findMany({
      where: {
        trainingId: { in: trainingIds },
      },
      select: {
        trainingId: true,
        muscleGroupId: true,
        MuscleGroup: {
          select: {
            id: true,
            title: true,
          },
        },
        plannedLoad: true,
        executedLoad: true,
        agonyCnt: true,
        synergyCnt: true,
      },
    });

    const loadsByTraining = new Map<number, typeof muscleLoads>();
    for (const load of muscleLoads) {
      if (!loadsByTraining.has(load.trainingId)) {
        loadsByTraining.set(load.trainingId, []);
      }
      loadsByTraining.get(load.trainingId)!.push(load);
    }

    const result = trainings.map((t) => ({
      trainingId: t.id,
      plannedTo: t.plannedTo,
      muscleGroups: (loadsByTraining.get(t.id) ?? []).map((load) => ({
        muscleGroupId: load.muscleGroupId,
        muscleGroupTitle: load.MuscleGroup.title,
        plannedLoad: load.plannedLoad,
        executedLoad: load.executedLoad,
        agonyCnt: load.agonyCnt,
        synergyCnt: load.synergyCnt,
      })),
    }));

    return NextResponse.json({
      data: result,
      meta: {
        total: result.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "limit must be a positive integer up to 100" },
        { status: 400 },
      );
    }
    console.error("Error in GET /trainings/muscle-load:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
