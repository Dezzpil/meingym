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

export async function handleTrainingExerciseExecuted(
  id: number,
  data: Record<string, { liftedCount: number; liftedWeight: number }>,
  trainingId: number,
) {
  console.log(id, data);
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    for (const [id, info] of Object.entries(data)) {
      await tx.trainingExerciseExecution.update({
        where: { id: parseInt(id) },
        data: {
          liftedCount: info.liftedCount ? info.liftedCount : 0,
          liftedWeight: info.liftedWeight ? info.liftedWeight : 0,
        },
      });
    }
  });

  await checkAllExercisesCompletedAndCompleteTraining(trainingId);

  revalidatePath(`/trainings/${id}/execute`);
}

export async function handleTrainingComplete(id: number) {
  await prisma.$transaction(async (tx) => {
    const exercises = await tx.trainingExercise.findMany({ where: { id } });
    const notCompleted = exercises.filter((e) => !e.completedAt);
    for (const e of notCompleted) {
      await tx.trainingExercise.update({
        where: { id: e.id },
        data: {
          startedAt: new Date(),
          completedAt: new Date(),
          isPassed: true,
        },
      });
    }

    await tx.training.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  });

  revalidatePath(`/trainings/${id}/execute`);
}

async function checkAllExercisesCompletedAndCompleteTraining(id: number) {
  const exercises = await prisma.trainingExercise.findMany({ where: { id } });
  const notCompleted = exercises.filter((e) => !e.completedAt);
  if (notCompleted.length === 0) {
    await prisma.training.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }
}
