"use server";

import { prisma } from "@/tools/db";
import { revalidatePath } from "next/cache";

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
      // @ts-ignore
      data: { startedAt: new Date(), completedAt: new Date(), isPassed: true },
    });
  });

  await checkAllExercisesCompletedAndCompleteTraining(trainingId);

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
  id: number,
  data: Record<string, { liftedCount: number; liftedWeight: number }>,
  trainingId: number,
) {
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    await tx.trainingExerciseExecution.updateMany({
      where: { exerciseId: id, executedAt: null },
      data: { isPassed: true },
    });
  });

  await checkAllExercisesCompletedAndCompleteTraining(trainingId);

  revalidatePath(`/trainings/${id}/execute`);
}

async function checkAllExercisesCompletedAndCompleteTraining(id: number) {
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
  });
  const notCompleted = exercises.filter((e) => !e.completedAt);
  if (notCompleted.length === 0) {
    await prisma.training.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }
}
