"use server";

import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { revalidatePath } from "next/cache";
import { SorenessFormFields, type SorenessFormFieldsType } from "@/app/soreness/types";
import { findTrainingAwaitingSoreness, findUnderLoadedMuscles } from "@/core/soreness";

export async function getTrainingAwaitingSoreness() {
  const userId = await getCurrentUserId();
  return findTrainingAwaitingSoreness(userId);
}

export async function saveSoreness(data: SorenessFormFieldsType): Promise<void> {
  const userId = await getCurrentUserId();
  const parsed = SorenessFormFields.parse(data);

  const training = await prisma.training.findUniqueOrThrow({
    where: { id: parsed.trainingId, userId },
    select: { completedAt: true },
  });

  if (!training.completedAt) {
    throw new Error("Training is not completed");
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

  await prisma.muscleSoreness.upsert({
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
  });

  revalidatePath("/");
}

export async function getUnderLoadedMuscles(trainingId: number) {
  const userId = await getCurrentUserId();
  return findUnderLoadedMuscles(userId, trainingId);
}
