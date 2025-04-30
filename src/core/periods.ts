import { prisma } from "@/tools/db";
import type {
  ProgressionStrategySimpleOpts,
  TrainingPeriod,
} from "@prisma/client";
import {
  ProgressionStrategySimpleOptsType,
  ProgressionStrategySimpleOptsDefaults,
} from "@/core/progression/strategy/simple";

export function pickOnlyOptsFromItem(
  item: ProgressionStrategySimpleOpts,
): ProgressionStrategySimpleOptsType {
  return {
    strengthPrepareSetsCount: item.strengthPrepareSetsCount,
    strengthWorkingSetsCount: item.strengthWorkingSetsCount,
    strengthWeightDelta: item.strengthWeightDelta,
    massSetsCount: item.massSetsCount,
    massBigCountCoef: item.massBigCountCoef,
    massWeightDelta: item.massWeightDelta,
    massAddDropSet: item.massAddDropSet,
    lossCountMax: item.lossCountMax,
    lossCountStep: item.lossCountStep,
    lossWeightDelta: item.lossWeightDelta,
    lossMaxSets: item.lossMaxSets,
  };
}

/**
 * Creates a new training period for a user.
 * If the user already has a current training period, it will be marked as not current
 * and its end date will be set to the current date.
 *
 * @param userId - The ID of the user to create a training period for
 * @param progressionOpts - Options for simple progression strategy for new training period
 * @returns The newly created training period
 */
export async function createTrainingPeriod(
  userId: string,
  progressionOpts?: ProgressionStrategySimpleOptsType,
): Promise<TrainingPeriod> {
  // First, find any current training period for the user and mark it as not current
  await prisma.trainingPeriod.updateMany({
    where: {
      userId,
      isCurrent: true,
    },
    data: {
      isCurrent: false,
      endDate: new Date(),
    },
  });

  const lastProgressionSimpleOpts =
    await prisma.progressionStrategySimpleOpts.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

  let opts = ProgressionStrategySimpleOptsDefaults;
  if (lastProgressionSimpleOpts) {
    opts = pickOnlyOptsFromItem(lastProgressionSimpleOpts);
  }
  if (progressionOpts) opts = Object.assign(opts, progressionOpts);

  return prisma.trainingPeriod.create({
    data: {
      userId,
      startDate: new Date(),
      isCurrent: true,
      ProgressionStrategySimpleOpts: {
        create: Object.assign({ userId }, opts),
      },
    },
  });
}

/**
 * Ends the current training period for a user.
 *
 * @param userId - The ID of the user whose current training period should be ended
 * @returns The updated training period, or null if no current period was found
 */
export async function endCurrentTrainingPeriod(
  userId: string,
): Promise<TrainingPeriod | null> {
  const currentPeriod = await prisma.trainingPeriod.findFirst({
    where: {
      userId,
      isCurrent: true,
    },
  });

  if (!currentPeriod) {
    return null;
  }

  return prisma.trainingPeriod.update({
    where: {
      id: currentPeriod.id,
    },
    data: {
      isCurrent: false,
      endDate: new Date(),
    },
  });
}

/**
 * Gets the current training period for a user.
 *
 * @param userId - The ID of the user to get the current training period for
 * @returns The current training period, or null if no current period exists
 */
export async function getCurrentTrainingPeriod(
  userId: string,
): Promise<TrainingPeriod | null> {
  return prisma.trainingPeriod.findFirst({
    where: {
      userId,
      isCurrent: true,
    },
  });
}

/**
 * Gets the current training period for a user with its progression options.
 *
 * @param userId - The ID of the user to get the current training period for
 * @returns The current training period with progression options, or null if no current period exists
 */
export async function getCurrentTrainingPeriodWithOptions(
  userId: string,
): Promise<{
  currentPeriod: TrainingPeriod | null;
  progressionOpts: ProgressionStrategySimpleOptsType | null;
}> {
  const currentPeriod = await prisma.trainingPeriod.findFirst({
    where: {
      userId,
      isCurrent: true,
    },
    include: {
      ProgressionStrategySimpleOpts: true,
    },
  });

  if (!currentPeriod || !currentPeriod.ProgressionStrategySimpleOpts) {
    return { currentPeriod, progressionOpts: null };
  }

  const progressionOpts = pickOnlyOptsFromItem(
    currentPeriod.ProgressionStrategySimpleOpts,
  );

  return { currentPeriod, progressionOpts };
}

/**
 * Gets all training periods for a user.
 *
 * @param userId - The ID of the user to get training periods for
 * @returns An array of training periods
 */
export async function getUserTrainingPeriods(
  userId: string,
): Promise<TrainingPeriod[]> {
  return prisma.trainingPeriod.findMany({
    where: {
      userId,
    },
    orderBy: {
      startDate: "desc",
    },
  });
}

export async function updateProgressionStrategySimpleOpts(
  id: number,
  opts: ProgressionStrategySimpleOptsType,
) {
  await prisma.progressionStrategySimpleOpts.update({
    where: { id },
    data: opts,
  });
}
