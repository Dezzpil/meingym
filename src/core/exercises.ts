import {
  ActionLoss,
  Action,
  ActionMass,
  ActionStrength,
  TrainingExercise,
  ActionRig,
  ActionRequire,
} from "@prisma/client";
import { PrismaTransactionClient } from "@/tools/types";
import { CurrentPurpose } from "@/core/types";
import {
  createLossInitial,
  createMassInitial,
  createStrengthInitial,
} from "@/core/approaches";
import { calculateExerciseDifficulty } from "@/core/difficulty";

export const RigsDefault = [
  ActionRig.OTHER,
  ActionRig.BARBELL,
  ActionRig.DUMBBELL,
  ActionRig.BLOCKS,
  ActionRig.KETTLEBELL,
];

export const RequiresDefault = [
  ActionRequire.UPBAR,
  ActionRequire.BENCH,
  ActionRequire.NONE,
  ActionRequire.SIMULATOR,
];

export const BASE_AGONY_COEF = 0.7;
export const BASE_SYNERGY_COEF = 0.3;

export function calcActionBase(
  agonyCount: number,
  synergyCount: number,
): number {
  return BASE_AGONY_COEF * agonyCount + BASE_SYNERGY_COEF * synergyCount;
}

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
    const exercise = await tx.trainingExercise.create({
      data: {
        trainingId,
        purposeId: purposeAction.id,
        purpose: purpose,
        priority: exercisesCount + 1,
        approachGroupId: purposeAction.currentApproachGroupId,
        actionId: actionId,
      },
    });

    // рассчитать оценку сложности выполнения упражнения при создании
    const approachGroup = await tx.approachesGroup.findUnique({
      where: { id: exercise.approachGroupId },
    });
    if (approachGroup) {
      console.log(approachGroup);
      const difficultyScore = calculateExerciseDifficulty({
        action,
        approachGroup,
        purpose,
      });
      console.log(
        `calc diff score for appgroup ${approachGroup.id}: ${difficultyScore}`,
      );
      await tx.trainingExercise.update({
        where: { id: exercise.id },
        data: { difficultyScore },
      });
    }
    return exercise;
  } else {
    throw new Error(
      `не удалось выбрать необходимые подходы для цели: ${purpose} для упражнения ${actionId}`,
    );
  }
}
