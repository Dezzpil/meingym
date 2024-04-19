import type { TrainingExercise } from "@prisma/client";
import { ActionMass, ActionStrength } from "@prisma/client";
import { PrismaTransactionClient } from "@/tools/types";

export async function createExercise(
  trainingId: number,
  actionId: number,
  purpose: "MASS" | "STRENGTH",
  userId: string,
  tx: PrismaTransactionClient,
): Promise<TrainingExercise> {
  const action = await tx.action.findUniqueOrThrow({
    where: { id: actionId },
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

  let purposeAction: ActionMass | ActionStrength;
  if (purpose === "MASS") {
    if (action.ActionMass.length === 0)
      throw new Error(
        `невозможно создать упражнение на массу, так как не указаны подходы выполнения`,
      );
    purposeAction = action.ActionMass[0] as ActionMass;
  } else {
    if (action.ActionStrength.length === 0)
      throw new Error(
        `невозможно создать упражнение на силу, так как не указаны подходы выполнения`,
      );
    purposeAction = action.ActionStrength[0] as ActionStrength;
  }

  const exercisesCount = await tx.trainingExercise.count({
    where: { trainingId },
  });
  return tx.trainingExercise.create({
    data: {
      trainingId,
      purposeId: purposeAction.id,
      purpose: purpose,
      priority: exercisesCount + 1,
      approachGroupId: purposeAction.currentApproachGroupId,
      actionId: actionId,
    },
  });
}
