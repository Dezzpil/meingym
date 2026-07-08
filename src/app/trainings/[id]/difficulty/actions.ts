"use server";

import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { revalidatePath } from "next/cache";
import { ExtraApproachesBoostStrategy } from "@/core/difficulty/extraApproachesBoost";
import { TrainingTimeAvgScorer } from "@/core/trainingTime/avgScorer";
import {
  recalculateExerciseDifficulty,
  recalculateTrainingDifficulty,
} from "@/core/difficulty/recalculate";
import type { TrainingExerciseWithApproaches } from "@/core/difficulty/boostStrategy";

/**
 * Применить усложнение тренировки (добавить доп. подходы с isBoost=true)
 */
export async function handleApplyDifficultyBoost(trainingId: number): Promise<void> {
  const userId = await getCurrentUserId();

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

  if (training.startedAt) {
    throw new Error("Нельзя изменить сложность после начала тренировки");
  }

  const exercises: TrainingExerciseWithApproaches[] = training.TrainingExercise.map((ex) => ({
    id: ex.id,
    approachGroupId: ex.approachGroupId,
    approachGroup: ex.ApproachGroup,
  }));

  const strategy = new ExtraApproachesBoostStrategy();
  await strategy.apply(exercises);

  // Recalculate time estimate
  await new TrainingTimeAvgScorer().score(trainingId);

  // Recalculate difficulty for all exercises in the training
  for (const ex of exercises) {
    await recalculateExerciseDifficulty(ex.id);
  }
  await recalculateTrainingDifficulty(trainingId);

  revalidatePath(`/trainings/${trainingId}`);
}

/**
 * Отменить усложнение тренировки (удалить все подходы с isBoost=true)
 */
export async function handleRevertDifficultyBoost(trainingId: number): Promise<void> {
  const userId = await getCurrentUserId();

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

  if (training.startedAt) {
    throw new Error("Нельзя отменить усложнение после начала тренировки");
  }

  const exercises: TrainingExerciseWithApproaches[] = training.TrainingExercise.map((ex) => ({
    id: ex.id,
    approachGroupId: ex.approachGroupId,
    approachGroup: ex.ApproachGroup,
  }));

  const strategy = new ExtraApproachesBoostStrategy();
  await strategy.revert(exercises);

  // Recalculate time estimate
  await new TrainingTimeAvgScorer().score(trainingId);

  // Recalculate difficulty for all exercises in the training
  for (const ex of exercises) {
    await recalculateExerciseDifficulty(ex.id);
  }
  await recalculateTrainingDifficulty(trainingId);

  revalidatePath(`/trainings/${trainingId}`);
}
