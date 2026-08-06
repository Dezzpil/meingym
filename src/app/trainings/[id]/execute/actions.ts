"use server";

import { prisma } from "@/tools/db";
import { revalidatePath } from "next/cache";
import { SetData } from "@/core/types";
import {
  calculateStats,
  findInfoForCalculationStatsForAction,
} from "@/core/stats";
import { PrismaTransactionClient, ServerActionResult } from "@/tools/types";
import type { TrainingExercise, TrainingRating } from "@prisma/client";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { createTrainingPeriod, getCurrentTrainingPeriod } from "@/core/periods";
import { createExercise } from "@/core/exercises";
import { processCompletedTrainingCore } from "@/core/trainingProcessing";

export async function handleTrainingWarmUpSkip(
  trainingId: number,
  isCircuit: boolean,
) {
  await prisma.trainingWarmUp.upsert({
    where: { trainingId },
    update: { isSkipped: true },
    create: { trainingId, isSkipped: true },
  });

  if (isCircuit) {
    await prisma.trainingExercise.updateMany({
      where: { trainingId },
      data: {
        startedAt: new Date(),
      },
    });
  }

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleTrainingWarmUpComplete(
  trainingId: number,
  trainingStartedAt: Date,
  isCircuit: boolean,
) {
  const duration = Math.max(
    0,
    Math.floor((Date.now() - trainingStartedAt.getTime()) / 1000),
  );
  await prisma.trainingWarmUp.update({
    where: { trainingId },
    data: { completedAt: new Date(), durationSec: duration, isSkipped: false },
  });

  if (isCircuit) {
    await prisma.trainingExercise.updateMany({
      where: { trainingId },
      data: {
        startedAt: new Date(),
      },
    });
  }

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleTrainingStart(id: number, isCircuit: boolean) {
  const userId = await getCurrentUserId();

  const userInfo = await findUserInfo(userId);
  let currentPeriod = await getCurrentTrainingPeriod(userId);
  if (!currentPeriod) {
    currentPeriod = await createTrainingPeriod(userId);
  }

  const training = await prisma.training.update({
    where: { id },
    data: {
      startedAt: new Date(),
      periodId: currentPeriod.id,
      noFeedback: !userInfo.collectExerciseExecutionFeedback,
    },
  });

  const warmUpData = training.noWarmUp
    ? { isSkipped: true }
    : { startedAt: new Date() };
  await prisma.trainingWarmUp.update({
    where: { trainingId: id },
    data: warmUpData,
  });

  if (training.noWarmUp && isCircuit) {
    await prisma.trainingExercise.updateMany({
      where: { trainingId: id },
      data: {
        startedAt: new Date(),
      },
    });
  }

  // do not auto-start exercises even for circuit until warm-up done
  revalidatePath(`/trainings/${id}/execute`);
}

export async function handleTrainingExerciseStart(
  id: number,
  trainingId: number,
) {
  // block if warm-up is not finished
  // @ts-ignore
  const warm = await prisma.trainingWarmUp.findUnique({
    where: { trainingId },
  });
  if (!warm || (!warm.isSkipped && !warm.completedAt)) {
    throw new Error(
      "Нельзя начать упражнения, пока разминка не завершена или не пропущена",
    );
  }

  await prisma.trainingExercise.update({
    where: { id },
    data: { startedAt: new Date() },
  });
  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleTrainingExercisePass(
  id: number,
  trainingId: number,
) {
  // block if warm-up is not finished
  // @ts-ignore
  const warm = await prisma.trainingWarmUp.findUnique({
    where: { trainingId },
  });
  if (!warm || (!warm.isSkipped && !warm.completedAt)) {
    throw new Error(
      "Нельзя пропустить упражнение, пока разминка не завершена или не пропущена",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.update({
      where: { id },
      data: { startedAt: new Date(), completedAt: new Date(), isPassed: true },
    });
  });

  await prisma.$transaction(async (tx) => {
    await checkAllExercisesCompletedAndCompleteTraining(trainingId, tx);
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function countExerciseNonExecuted(
  exerciseId: number,
): Promise<number> {
  return prisma.trainingExerciseExecution.count({
    where: { exerciseId, executedAt: null },
  });
}

export async function handleTrainingExerciseExecuted(
  exercise: Pick<TrainingExercise, "id" | "trainingId" | "actionId">,
  rating?: TrainingRating | null,
  comment?: string | null,
): Promise<ServerActionResult> {
  try {
    await prisma.trainingExerciseExecution.updateMany({
      where: {
        exerciseId: exercise.id,
        executedAt: null,
      },
      data: { isPassed: true },
    });

    const userId = await getCurrentUserId();
    await prisma.$transaction(async (tx) => {
      const executions = await tx.trainingExerciseExecution.findMany({
        where: { exerciseId: exercise.id, isPassed: false },
      });

      const sets: SetData[] = executions.map((e) => {
        return { weight: e.liftedWeight, count: e.liftedCount };
      });
      const info = await findInfoForCalculationStatsForAction(
        exercise.actionId,
        userId,
        tx,
      );
      const {
        weightSum: liftedSum,
        weightMean: liftedMean,
        countSum: liftedCountTotal,
        weightMax,
        countMean: liftedCountMean,
      } = calculateStats(sets, info.actionrig, info.userweight);

      await tx.trainingExercise.update({
        where: { id: exercise.id },
        data: Object.assign(
          {
            completedAt: new Date(),
            liftedSum,
            liftedMean,
            liftedCountTotal,
            liftedCountMean,
            liftedMax: weightMax,
          },
          rating ? { rating } : {},
          comment ? { comment } : {},
        ),
      });
    });
    await prisma.$transaction(async (tx) => {
      await checkAllExercisesCompletedAndCompleteTraining(
        exercise.trainingId,
        tx,
      );
    });
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  revalidatePath(`/trainings/${exercise.trainingId}/execute`);
  return { ok: true, error: null };
}

async function checkAllExercisesCompletedAndCompleteTraining(
  id: number,
  tx: PrismaTransactionClient,
): Promise<boolean> {
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
  });
  const notCompleted = exercises.filter((e) => !e.completedAt);
  if (notCompleted.length === 0) {
    await tx.training.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    console.log(`training ${id} completed`);
    return true;
  }
  return false;
}

export async function handleAddExecutionApproach(
  trainingId: number,
  exerciseId: number,
): Promise<void> {
  let plannedWeigth = 0;
  let plannedCount = 0;
  let priority = 1;
  const lastExecution = await prisma.trainingExerciseExecution.findFirst({
    where: { exerciseId },
    orderBy: { priority: "desc" },
  });
  if (lastExecution) {
    plannedWeigth = lastExecution.plannedWeigth;
    plannedCount = lastExecution.plannedCount;
    priority = lastExecution.priority + 1;
  }
  await prisma.trainingExerciseExecution.create({
    data: {
      exerciseId,
      plannedWeigth,
      plannedCount,
      priority,
      liftedCount: 0,
      liftedWeight: 0,
      approachId: null,
    },
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleProcessCompletedTraining(
  trainingId: number,
): Promise<void> {
  const userId = await getCurrentUserId();
  await processCompletedTrainingCore(trainingId, userId);
  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleCompleteTrainingManually(trainingId: number) {
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.updateMany({
      where: { trainingId, completedAt: null },
      data: { completedAt: new Date(), isPassed: true },
    });
    await tx.training.update({
      where: { id: trainingId },
      data: { completedAt: new Date() },
    });
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleReplaceExercise(
  exerciseId: number,
  newActionId: number,
): Promise<ServerActionResult> {
  try {
    const userId = await getCurrentUserId();

    // Get the exercise to be replaced
    const exercise = await prisma.trainingExercise.findUniqueOrThrow({
      where: { id: exerciseId },
    });

    // Check if the new action is already in the training
    const existingExercise = await prisma.trainingExercise.findFirst({
      where: {
        trainingId: exercise.trainingId,
        actionId: newActionId,
      },
    });

    if (existingExercise) {
      return {
        ok: false,
        error: "Это упражнение уже присутствует в тренировке",
      };
    }

    // Create the new exercise with the same purpose as the old one
    await prisma.$transaction(async (tx) => {
      // Create the new exercise
      await createExercise(
        exercise.trainingId,
        newActionId,
        exercise.purpose,
        userId,
        tx,
      );

      // Delete the old exercise
      await tx.trainingExercise.delete({
        where: { id: exerciseId },
      });
    });

    revalidatePath(`/trainings/${exercise.trainingId}/execute`);
    return { ok: true, error: null };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
