import { prisma } from "@/tools/db";
import { DifficultyChoice } from "@prisma/client";
import { calculateBurnoutScore } from "@/core/burnout";

const PAGE_SIZE = 20;

export type MobileCheckupDTO = {
  id: number;
  trainingId: number;
  sleep: number;
  nutrition: number;
  preWorkout: number;
  stress: number;
  burnoutExhaustion: number | null;
  burnoutDistance: number | null;
  burnoutCognitive: number | null;
  burnoutEmotional: number | null;
  burnoutScore: number | null;
  difficultyChoice: DifficultyChoice | null;
  createdAt: string;
};

export type MobileCheckupListResponse = {
  meta: {
    total: number;
    nextCursor: number | null;
  };
  items: MobileCheckupDTO[];
};

export type MobileCheckupInput = {
  trainingId: number;
  sleep: number;
  nutrition: number;
  preWorkout: number;
  stress: number;
  burnoutExhaustion?: number | null;
  burnoutDistance?: number | null;
  burnoutCognitive?: number | null;
  burnoutEmotional?: number | null;
  difficultyChoice?: DifficultyChoice | null;
};

export type MobileCheckupSettingsDTO = {
  checkupsEnabled: boolean;
  isEmployed: boolean;
};

export async function getCheckupList(
  userId: string,
  cursor?: number,
): Promise<MobileCheckupListResponse> {
  const where = {
    userId,
    ...(cursor ? { id: { gt: cursor } } : {}),
  };

  const [checkups, total] = await Promise.all([
    prisma.checkup.findMany({
      where,
      take: PAGE_SIZE + 1,
      orderBy: { id: "asc" },
    }),
    prisma.checkup.count({ where: { userId } }),
  ]);

  const hasMore = checkups.length > PAGE_SIZE;
  const items = hasMore ? checkups.slice(0, PAGE_SIZE) : checkups;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const dtos: MobileCheckupDTO[] = items.map((c) => ({
    id: c.id,
    trainingId: c.trainingId,
    sleep: c.sleep,
    nutrition: c.nutrition,
    preWorkout: c.preWorkout,
    stress: c.stress,
    burnoutExhaustion: c.burnoutExhaustion,
    burnoutDistance: c.burnoutDistance,
    burnoutCognitive: c.burnoutCognitive,
    burnoutEmotional: c.burnoutEmotional,
    burnoutScore: c.burnoutScore,
    difficultyChoice: c.difficultyChoice,
    createdAt: c.createdAt.toISOString(),
  }));

  return { meta: { total, nextCursor }, items: dtos };
}

export async function getCheckupForTraining(
  userId: string,
  trainingId: number,
): Promise<MobileCheckupDTO | null> {
  const checkup = await prisma.checkup.findUnique({
    where: { trainingId },
  });

  if (!checkup || checkup.userId !== userId) return null;

  return {
    id: checkup.id,
    trainingId: checkup.trainingId,
    sleep: checkup.sleep,
    nutrition: checkup.nutrition,
    preWorkout: checkup.preWorkout,
    stress: checkup.stress,
    burnoutExhaustion: checkup.burnoutExhaustion,
    burnoutDistance: checkup.burnoutDistance,
    burnoutCognitive: checkup.burnoutCognitive,
    burnoutEmotional: checkup.burnoutEmotional,
    burnoutScore: checkup.burnoutScore,
    difficultyChoice: checkup.difficultyChoice,
    createdAt: checkup.createdAt.toISOString(),
  };
}

export async function createCheckup(
  userId: string,
  input: MobileCheckupInput,
): Promise<MobileCheckupDTO> {
  const burnoutAnswers =
    input.burnoutExhaustion != null &&
    input.burnoutDistance != null &&
    input.burnoutCognitive != null &&
    input.burnoutEmotional != null
      ? {
          exhaustion: input.burnoutExhaustion,
          distance: input.burnoutDistance,
          cognitive: input.burnoutCognitive,
          emotional: input.burnoutEmotional,
        }
      : null;

  const burnoutScore = burnoutAnswers
    ? calculateBurnoutScore(burnoutAnswers)
    : null;

  const checkup = await prisma.checkup.upsert({
    where: { trainingId: input.trainingId },
    update: {
      sleep: input.sleep,
      nutrition: input.nutrition,
      preWorkout: input.preWorkout,
      stress: input.stress,
      burnoutExhaustion: input.burnoutExhaustion ?? null,
      burnoutDistance: input.burnoutDistance ?? null,
      burnoutCognitive: input.burnoutCognitive ?? null,
      burnoutEmotional: input.burnoutEmotional ?? null,
      burnoutScore,
      difficultyChoice: input.difficultyChoice ?? null,
    },
    create: {
      userId,
      trainingId: input.trainingId,
      sleep: input.sleep,
      nutrition: input.nutrition,
      preWorkout: input.preWorkout,
      stress: input.stress,
      burnoutExhaustion: input.burnoutExhaustion ?? null,
      burnoutDistance: input.burnoutDistance ?? null,
      burnoutCognitive: input.burnoutCognitive ?? null,
      burnoutEmotional: input.burnoutEmotional ?? null,
      burnoutScore,
      difficultyChoice: input.difficultyChoice ?? null,
    },
  });

  return {
    id: checkup.id,
    trainingId: checkup.trainingId,
    sleep: checkup.sleep,
    nutrition: checkup.nutrition,
    preWorkout: checkup.preWorkout,
    stress: checkup.stress,
    burnoutExhaustion: checkup.burnoutExhaustion,
    burnoutDistance: checkup.burnoutDistance,
    burnoutCognitive: checkup.burnoutCognitive,
    burnoutEmotional: checkup.burnoutEmotional,
    burnoutScore: checkup.burnoutScore,
    difficultyChoice: checkup.difficultyChoice,
    createdAt: checkup.createdAt.toISOString(),
  };
}

export async function getCheckupSettings(
  userId: string,
): Promise<MobileCheckupSettingsDTO> {
  const userInfo = await prisma.userInfo.findFirst({
    where: { userId },
    select: { checkupsEnabled: true, isEmployed: true },
  });

  return {
    checkupsEnabled: userInfo?.checkupsEnabled ?? true,
    isEmployed: userInfo?.isEmployed ?? false,
  };
}

export async function updateCheckupSettings(
  userId: string,
  settings: Partial<MobileCheckupSettingsDTO>,
): Promise<MobileCheckupSettingsDTO> {
  await prisma.userInfo.updateMany({
    where: { userId },
    data: {
      ...(settings.checkupsEnabled !== undefined
        ? { checkupsEnabled: settings.checkupsEnabled }
        : {}),
      ...(settings.isEmployed !== undefined
        ? { isEmployed: settings.isEmployed }
        : {}),
    },
  });

  return getCheckupSettings(userId);
}
