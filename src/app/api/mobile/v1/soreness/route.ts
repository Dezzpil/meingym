import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { prisma } from "@/tools/db";
import { z } from "zod";
import { SorenessIntensity } from "@prisma/client";

const SorenessEntrySchema = z.object({
  muscleId: z.number().int().positive(),
  intensity: z.nativeEnum(SorenessIntensity),
});

const SorenessSchema = z.object({
  trainingId: z.number().int().positive(),
  entries: z.array(SorenessEntrySchema).min(1),
});

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
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const { userId } = payload;
    const body = await request.json();
    const parsed = SorenessSchema.parse(body);

    const training = await prisma.training.findUnique({
      where: { id: parsed.trainingId, userId },
      select: { completedAt: true },
    });

    if (!training) {
      return NextResponse.json(
        { error: "Training not found" },
        { status: 404 },
      );
    }

    if (!training.completedAt) {
      return NextResponse.json(
        { error: "Training is not completed" },
        { status: 400 },
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedDate = new Date(
      training.completedAt.getFullYear(),
      training.completedAt.getMonth(),
      training.completedAt.getDate(),
    );
    const daysAfter = Math.round(
      (todayStart.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000),
    );

    const soreness = await prisma.muscleSoreness.upsert({
      where: { trainingId: parsed.trainingId },
      update: {
        daysAfter,
        Entries: {
          deleteMany: {},
          createMany: {
            data: parsed.entries.map((e) => ({
              muscleId: e.muscleId,
              intensity: e.intensity,
            })),
          },
        },
      },
      create: {
        userId,
        trainingId: parsed.trainingId,
        daysAfter,
        Entries: {
          createMany: {
            data: parsed.entries.map((e) => ({
              muscleId: e.muscleId,
              intensity: e.intensity,
            })),
          },
        },
      },
      include: {
        Entries: {
          include: {
            Muscle: { select: { id: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: soreness });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") },
        { status: 400 },
      );
    }
    console.error("Error in POST /soreness:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
