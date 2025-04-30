import { prisma } from "@/tools/db";
import type { TrainingPeriod } from "@prisma/client";

/**
 * Creates a new training period for a user.
 * If the user already has a current training period, it will be marked as not current
 * and its end date will be set to the current date.
 *
 * @param userId - The ID of the user to create a training period for
 * @returns The newly created training period
 */
export async function createTrainingPeriod(
  userId: string,
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

  // Then create a new training period
  return prisma.trainingPeriod.create({
    data: {
      userId,
      startDate: new Date(),
      isCurrent: true,
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
