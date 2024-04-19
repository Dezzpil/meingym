"use server";

import { prisma } from "@/tools/db";
import { revalidatePath } from "next/cache";
import { SetData } from "@/core/types";
import { calculateStats } from "@/core/stats";
import {
  createApproachGroup,
  linkNewApproachGroupToActionByPurpose,
} from "@/core/approaches";
import { PrismaTransactionClient } from "@/tools/types";
import { TrainingExercise, TrainingExerciseExecution } from "@prisma/client";
import { ApproachLiftData } from "@/app/approaches/types";

export async function handleTrainingStart(id: number) {
  await prisma.training.update({
    where: { id },
    data: { startedAt: new Date() },
  });
  revalidatePath(`/trainings/${id}/execute`);
}

export async function handleTrainingExerciseStart(
  id: number,
  trainingId: number,
) {
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
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.update({
      where: { id },
      data: { startedAt: new Date(), completedAt: new Date(), isPassed: true },
    });
  });

  await prisma.$transaction(async (tx) => {
    if (await checkAllExercisesCompletedAndCompleteTraining(trainingId, tx)) {
      console.log(`training ${trainingId} completed`);
      await createNewApproachGroupsAndLinkThem(trainingId, tx);
    }
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
  exerciseId: number,
  data: Record<string, { liftedCount: number; liftedWeight: number }>,
  trainingId: number,
) {
  await prisma.$transaction(async (tx) => {
    await tx.trainingExerciseExecution.updateMany({
      where: { exerciseId, executedAt: null },
      data: { isPassed: true },
    });

    const executions = await tx.trainingExerciseExecution.findMany({
      where: { isPassed: false },
    });

    const sets: SetData[] = executions.map((e) => {
      return { weight: e.liftedWeight, count: e.liftedCount };
    });
    const { sum: liftedSum, mean: liftedMean } = calculateStats(sets);

    await tx.trainingExercise.update({
      where: { id: exerciseId },
      data: { completedAt: new Date(), liftedSum, liftedMean },
    });

    console.log(`update lifted stats for exercise ${exerciseId}`);
  });

  await prisma.$transaction(async (tx) => {
    if (await checkAllExercisesCompletedAndCompleteTraining(trainingId, tx)) {
      console.log(`training ${trainingId} completed`);
      await createNewApproachGroupsAndLinkThem(trainingId, tx);
    }
  });

  revalidatePath(`/trainings/${exerciseId}/execute`);
}

async function createNewApproachGroupsAndLinkThem(
  trainingId: number,
  tx: PrismaTransactionClient,
) {
  const training = await tx.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: {
      TrainingExercise: { include: { TrainingExerciseExecution: true } },
    },
  });
  // пересоздадим подходы, из которых будет собираться следующая тренировка?
  for (const e of training.TrainingExercise) {
    const exercise = e as TrainingExercise & {
      TrainingExerciseExecution: TrainingExerciseExecution[];
    };
    const setsData: ApproachLiftData[] = exercise.TrainingExerciseExecution.map(
      (e) => {
        return {
          priority: e.priority,
          count: e.liftedCount,
          weight: e.liftedWeight,
        };
      },
    );
    const approachGroupFromExecution = await createApproachGroup(
      tx,
      setsData,
      exercise.actionId,
      training.userId,
    );
    await linkNewApproachGroupToActionByPurpose(
      tx,
      exercise.purpose,
      exercise.purposeId,
      approachGroupFromExecution,
    );
  }
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
