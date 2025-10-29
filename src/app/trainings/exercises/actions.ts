"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { getCurrentUserId } from "@/tools/auth";
import { createExercise } from "@/core/exercises";
import { ServerActionResult } from "@/tools/types";
import { TrainingTimeAvgScorer } from "@/core/trainingTime/avgScorer";

export async function handleAddExercise(
  trainingId: number,
  data: ExerciseAddFieldsType,
): Promise<ServerActionResult | void> {
  try {
    const userId = await getCurrentUserId();
    const existed = await prisma.trainingExercise.findFirst({
      where: { trainingId, actionId: data.actionId },
    });
    if (existed)
      return { ok: false, error: "Движение уже присутствует в тренировке" };

    await prisma.$transaction(async (tx) => {
      await createExercise(trainingId, data.actionId, data.purpose, userId, tx);
    });

    new TrainingTimeAvgScorer().score(trainingId).catch((e) => console.log(e));
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  revalidatePath(`/trainings/${trainingId}`);
}

export async function handleDeleteExercise(id: number) {
  const ex = await prisma.trainingExercise.delete({ where: { id } });
  new TrainingTimeAvgScorer().score(id).catch((e) => console.log(e));
  revalidatePath(`/trainings/${ex.trainingId}`);
}

export async function handleChangeExercisePriority(
  id: number,
  moveUp: boolean,
) {
  const change = moveUp ? -1 : 1;
  const ex = await prisma.trainingExercise.findUniqueOrThrow({ where: { id } });
  if ((moveUp && ex.priority > 0) || !moveUp) {
    const siblingEx = await prisma.trainingExercise.findFirst({
      where: {
        trainingId: ex.trainingId,
        priority: ex.priority + change,
      },
    });
    if (siblingEx) {
      await prisma.$transaction(async (tx) => {
        await tx.trainingExercise.update({
          where: { id: siblingEx.id },
          data: { priority: ex.priority },
        });
        await tx.trainingExercise.update({
          where: { id: ex.id },
          data: { priority: siblingEx.priority },
        });
      });
    }

    new TrainingTimeAvgScorer()
      .score(ex.trainingId)
      .catch((e) => console.log(e));
  }

  revalidatePath(`/trainings/${ex.trainingId}`);
}
