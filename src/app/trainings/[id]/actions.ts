"use server";

import { TrainingFormFieldsType } from "@/app/trainings/types";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { createExercise } from "@/core/exercises";
import { redirect } from "next/navigation";

export async function handleChangeTrainingDate(
  id: number,
  data: TrainingFormFieldsType,
) {
  await prisma.training.update({
    where: { id },
    data: { plannedTo: data.plannedTo },
  });

  revalidatePath(`/trainings/${id}`);
}

export async function handleRepeatTraining(
  id: number,
  data: TrainingFormFieldsType,
) {
  const training = await prisma.$transaction(async (tx) => {
    const curTraining = await tx.training.findUniqueOrThrow({
      where: { id },
      include: { TrainingExercise: true },
    });

    const nextTraining = await tx.training.create({
      data: {
        plannedTo: data.plannedTo,
        userId: curTraining.userId,
      },
    });

    for (const exercise of curTraining.TrainingExercise) {
      await createExercise(
        nextTraining.id,
        exercise.actionId,
        exercise.purpose,
        curTraining.userId,
        tx,
      );
    }
    return nextTraining;
  });

  redirect(`/trainings/${training.id}`);
}
