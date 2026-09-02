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
import { prisma } from "@/tools/db";

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

/**
 * Расчёт базовости упражнения по sizeFactor мышц.
 * Формула: 0.7 * сумма sizeFactor агонистов + 0.3 * сумма sizeFactor синергистов.
 */
export function calcActionBase(
  agonistSizeFactors: number[],
  synergistSizeFactors: number[],
): number {
  const agonySum = agonistSizeFactors.reduce((sum, sf) => sum + sf, 0);
  const synergySum = synergistSizeFactors.reduce((sum, sf) => sum + sf, 0);
  return BASE_AGONY_COEF * agonySum + BASE_SYNERGY_COEF * synergySum;
}

/**
 * Пересчитывает базовость (base) всех упражнений, связанных с мышцей
 * как агонист или синергист. Вызывается при обновлении sizeFactor мышцы.
 */
export async function recalcBaseForMuscle(muscleId: number): Promise<void> {
  // Находим все ID упражнений, где мышца является агонистом или синергистом
  const [agonyLinks, synergyLinks] = await Promise.all([
    prisma.actionsOnMusclesAgony.findMany({
      where: { muscleId },
      select: { actionId: true },
    }),
    prisma.actionsOnMusclesSynergy.findMany({
      where: { muscleId },
      select: { actionId: true },
    }),
  ]);

  const affectedActionIds = [
    ...new Set([
      ...agonyLinks.map((l) => l.actionId),
      ...synergyLinks.map((l) => l.actionId),
    ]),
  ];

  if (affectedActionIds.length === 0) return;

  // Загружаем все мышцы-агонисты для затронутых упражнений одним запросом
  const allAgony = await prisma.actionsOnMusclesAgony.findMany({
    where: { actionId: { in: affectedActionIds } },
    select: { actionId: true, muscleId: true },
  });

  // Загружаем все мышцы-синергисты для затронутых упражнений одним запросом
  const allSynergy = await prisma.actionsOnMusclesSynergy.findMany({
    where: { actionId: { in: affectedActionIds } },
    select: { actionId: true, muscleId: true },
  });

  // Собираем все уникальные ID мышц и загружаем их sizeFactor одним запросом
  const allMuscleIds = [
    ...new Set([...allAgony.map((a) => a.muscleId), ...allSynergy.map((s) => s.muscleId)]),
  ];
  const muscles = await prisma.muscle.findMany({
    where: { id: { in: allMuscleIds } },
    select: { id: true, sizeFactor: true },
  });
  const sizeFactorMap = new Map(muscles.map((m) => [m.id, m.sizeFactor]));

  // Группируем по actionId и вычисляем базовость
  const updates = affectedActionIds.map((actionId) => {
    const agonistSizeFactors = allAgony
      .filter((a) => a.actionId === actionId)
      .map((a) => sizeFactorMap.get(a.muscleId) ?? 0);
    const synergistSizeFactors = allSynergy
      .filter((s) => s.actionId === actionId)
      .map((s) => sizeFactorMap.get(s.muscleId) ?? 0);

    const base = calcActionBase(agonistSizeFactors, synergistSizeFactors);
    return prisma.action.update({ where: { id: actionId }, data: { base } });
  });

  // Выполняем все обновления в транзакции
  await prisma.$transaction(updates);
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
      purposeAction = await createStrengthInitial(userId, actionId, tx);
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
