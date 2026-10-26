"use server";

import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { revalidatePath } from "next/cache";
import { CheckupFormFieldsType } from "@/app/checkup/types";
import { calculateBurnoutScore } from "@/core/burnout";
import { ExtraApproachesBoostStrategy } from "@/core/difficulty/extraApproachesBoost";
import { TrainingTimeAvgScorer } from "@/core/trainingTime/avgScorer";
import {
  recalculateExerciseDifficulty,
  recalculateTrainingDifficulty,
} from "@/core/difficulty/recalculate";
import { recomputeTrainingMuscleLoad } from "@/core/muscleLoad/recalculate";
import type { TrainingExerciseWithApproaches } from "@/core/difficulty/boostStrategy";
import { DifficultyChoice } from "@prisma/client";

export async function saveCheckup(data: CheckupFormFieldsType): Promise<void> {
  const userId = await getCurrentUserId();

  const burnoutAnswers =
    data.burnoutExhaustion != null &&
    data.burnoutDistance != null &&
    data.burnoutCognitive != null &&
    data.burnoutEmotional != null
      ? {
          exhaustion: data.burnoutExhaustion,
          distance: data.burnoutDistance,
          cognitive: data.burnoutCognitive,
          emotional: data.burnoutEmotional,
        }
      : null;

  const burnoutScore = burnoutAnswers
    ? calculateBurnoutScore(burnoutAnswers)
    : null;

  await prisma.checkup.upsert({
    where: { trainingId: data.trainingId },
    update: {
      sleep: data.sleep,
      nutrition: data.nutrition,
      preWorkout: data.preWorkout,
      stress: data.stress,
      burnoutExhaustion: data.burnoutExhaustion ?? null,
      burnoutDistance: data.burnoutDistance ?? null,
      burnoutCognitive: data.burnoutCognitive ?? null,
      burnoutEmotional: data.burnoutEmotional ?? null,
      burnoutScore,
      difficultyChoice: data.difficultyChoice ?? null,
    },
    create: {
      userId,
      trainingId: data.trainingId,
      sleep: data.sleep,
      nutrition: data.nutrition,
      preWorkout: data.preWorkout,
      stress: data.stress,
      burnoutExhaustion: data.burnoutExhaustion ?? null,
      burnoutDistance: data.burnoutDistance ?? null,
      burnoutCognitive: data.burnoutCognitive ?? null,
      burnoutEmotional: data.burnoutEmotional ?? null,
      burnoutScore,
      difficultyChoice: data.difficultyChoice ?? null,
    },
  });

  if (data.difficultyChoice === DifficultyChoice.BOOST) {
    await applyDifficultyBoost(data.trainingId, userId);
  }

  revalidatePath(`/trainings/${data.trainingId}/execute`);
}

async function applyDifficultyBoost(
  trainingId: number,
  userId: string,
): Promise<void> {
  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId, userId },
    include: {
      TrainingExercise: {
        include: {
          ApproachGroup: {
            include: { Approaches: { orderBy: { priority: "asc" } } },
          },
        },
      },
    },
  });

  if (training.startedAt) return;

  const exercises: TrainingExerciseWithApproaches[] =
    training.TrainingExercise.map((ex) => ({
      id: ex.id,
      approachGroupId: ex.approachGroupId,
      approachGroup: ex.ApproachGroup,
    }));

  const strategy = new ExtraApproachesBoostStrategy();
  await strategy.apply(exercises);

  await new TrainingTimeAvgScorer().score(trainingId);

  for (const ex of exercises) {
    await recalculateExerciseDifficulty(ex.id);
  }
  await recalculateTrainingDifficulty(trainingId);
  await recomputeTrainingMuscleLoad(trainingId);
}

export async function getCheckupForTraining(trainingId: number) {
  const userId = await getCurrentUserId();
  return prisma.checkup.findFirst({
    where: { trainingId, userId },
  });
}

export async function getCheckupHistory(limit = 20, offset = 0) {
  const userId = await getCurrentUserId();
  return prisma.checkup.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      Training: {
        select: {
          id: true,
          plannedTo: true,
          completedAt: true,
        },
      },
    },
  });
}

export async function getCheckupSettings() {
  const userId = await getCurrentUserId();
  const userInfo = await prisma.userInfo.findFirst({
    where: { userId },
    select: { checkupsEnabled: true, isEmployed: true },
  });
  return {
    checkupsEnabled: userInfo?.checkupsEnabled ?? true,
    isEmployed: userInfo?.isEmployed ?? false,
  };
}
