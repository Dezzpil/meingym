"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { getCurrentUserId } from "@/tools/auth";
import { createExercise } from "@/core/exercises";

export async function handleAddExercise(
  trainingId: number,
  data: ExerciseAddFieldsType,
) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    await createExercise(trainingId, data.actionId, data.purpose, userId, tx);
  });
  revalidatePath(`/trainings/${trainingId}`);
}

export async function handleDeleteExercise(id: number) {
  const ex = await prisma.trainingExercise.delete({ where: { id } });
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
  }

  revalidatePath(`/trainings/${ex.trainingId}`);
}
