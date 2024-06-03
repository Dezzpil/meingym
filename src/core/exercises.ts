import type {
  ActionLoss,
  Action,
  ActionMass,
  ActionStrength,
  TrainingExercise,
} from "@prisma/client";
import { PrismaTransactionClient } from "@/tools/types";
import { CurrentPurpose } from "@/core/types";
import {
  createLossInitial,
  createMassInitial,
  createStrengthInitial,
} from "@/core/approaches";

export async function createExercise(
  trainingId: number,
  actionId: number,
  purpose: CurrentPurpose,
  userId: string,
  tx: PrismaTransactionClient,
): Promise<TrainingExercise> {
  const action: Action & {
    ActionMass?: ActionMass[] | undefined;
    ActionLoss?: ActionLoss[] | undefined;
    ActionStrength?: ActionStrength[] | undefined;
  } = await tx.action.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      ActionMass:
        purpose === "MASS"
          ? {
              where: { userId },
              take: 1,
              include: { CurrentApproachGroup: true },
            }
          : undefined,
      ActionStrength:
        purpose === "STRENGTH"
          ? {
              where: { userId },
              take: 1,
              include: { CurrentApproachGroup: true },
            }
          : undefined,
      ActionLoss:
        purpose === "LOSS"
          ? {
              where: { userId },
              take: 1,
              include: { CurrentApproachGroup: true },
            }
          : undefined,
    },
  });

  if (!action.strengthAllowed && purpose === "STRENGTH") {
    throw new Error(`Нельзя выбрать силовое выполнение для этого движения`);
  }

  let purposeAction: ActionMass | ActionStrength | ActionLoss | undefined =
    undefined;

  if (purpose === "MASS") {
    if (action.ActionMass?.length === 0) {
      purposeAction = await createMassInitial(
        userId,
        actionId,
        action.rig,
        action.bigCount,
        tx,
      );
    } else {
      // @ts-ignore
      purposeAction = action.ActionMass[0] as ActionMass;
    }
  }
  if (purpose === "STRENGTH") {
    if (action.ActionStrength?.length === 0) {
      purposeAction = await createStrengthInitial(
        userId,
        actionId,
        action.strengthAllowed,
        tx,
      );
    } else {
      // @ts-ignore
      purposeAction = action.ActionStrength[0] as ActionStrength;
    }
  }
  if (purpose === "LOSS") {
    if (action.ActionLoss?.length === 0) {
      purposeAction = await createLossInitial(
        userId,
        actionId,
        action.rig,
        action.bigCount,
        tx,
      );
    } else {
      // @ts-ignore
      purposeAction = action.ActionLoss[0] as ActionLoss;
    }
  }

  if (purposeAction) {
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
  } else {
    throw new Error(
      `не удалось выбрать необходимые подходы для цели: ${purpose} для упражнения ${actionId}`,
    );
  }
}
