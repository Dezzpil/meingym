"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { ActionMass, ActionStrength } from "@prisma/client";
import { getCurrentUserId } from "@/tools/auth";

export async function handleAddExercise(
  trainingId: number,
  data: ExerciseAddFieldsType,
) {
  const userId = await getCurrentUserId();
  const action = await prisma.action.findUniqueOrThrow({
    where: { id: data.actionId },
    include: {
      ActionMass: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: true },
      },
      ActionStrength: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: true },
      },
    },
  });

  let purpose: ActionMass | ActionStrength;
  if (data.purpose === "MASS") {
    purpose = action.ActionMass[0] as ActionMass;
  } else {
    purpose = action.ActionStrength[0] as ActionStrength;
  }

  prisma.$transaction(async (tx) => {
    const exercisesCount = await tx.trainingExercise.count({
      where: { trainingId },
    });
    await tx.trainingExercise.create({
      data: {
        trainingId,
        purposeId: purpose.id,
        purpose: data.purpose,
        priority: exercisesCount + 1,
        approachGroupId: purpose.currentApproachGroupId,
        actionId: data.actionId,
      },
    });
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
