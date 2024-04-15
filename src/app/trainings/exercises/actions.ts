"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { ActionMass, ActionStrength } from "@prisma/client";
import { ApproachData, createApproachGroup } from "@/lib/approaches";

export async function handleAddExercise(
  trainingId: number,
  data: ExerciseAddFieldsType,
) {
  const action = await prisma.action.findUniqueOrThrow({
    where: { id: data.actionId },
    include: {
      Mass: { include: { CurrentApproachGroup: true } },
      Strength: { include: { CurrentApproachGroup: true } },
    },
  });

  let approachGroupId: number;
  if (data.purpose === "MASS") {
    approachGroupId = (action.Mass as ActionMass).currentApproachGroupId;
  } else {
    approachGroupId = (action.Strength as ActionStrength)
      .currentApproachGroupId;
  }

  const currentApproachGroup = await prisma.approachesGroup.findUniqueOrThrow({
    where: { id: approachGroupId },
    include: { Approaches: true },
  });

  const approachUpgraded: ApproachData[] = [];
  for (const current of currentApproachGroup.Approaches) {
    approachUpgraded.push({
      weight: current.weight,
      count: current.count,
      priority: current.priority,
    });
  }

  prisma.$transaction(async (tx) => {
    const approachGroup = await createApproachGroup(tx, approachUpgraded);
    const exercisesCount = await tx.trainingExercise.count({
      where: { trainingId },
    });
    await tx.trainingExercise.create({
      data: {
        trainingId,
        purpose: data.purpose,
        priority: exercisesCount + 1,
        approachGroupId: approachGroup.id,
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
