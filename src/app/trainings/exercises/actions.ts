"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { ActionMass, ActionStrength } from "@prisma/client";
import {
  ApproachData,
  createApproachGroup,
  MIN_BARBELL_WEIGHT,
} from "@/lib/approaches";

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

  // take current action approaches and increase weight with min barbell weight
  // TODO think up about strategies of load progress, here the simplest one
  // TODO define if action with barbell or dumbbell and use min weight for each corr.

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
      weight: current.weight + MIN_BARBELL_WEIGHT * 2,
      count: current.count,
      priority: current.priority,
    });
  }

  prisma.$transaction(async (tx) => {
    const approachGroup = await createApproachGroup(tx, approachUpgraded);
    await tx.trainingExercise.create({
      data: {
        trainingId,
        purpose: data.purpose,
        priority: data.priority,
        approachGroupId: approachGroup.id,
        actionId: data.actionId,
      },
    });
  });

  revalidatePath(`/trainings/${trainingId}`);
}
