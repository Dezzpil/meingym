import { prisma } from "@/tools/db";
import { getCurrentDayBorders } from "@/tools/dates";
import { SorenessIntensity } from "@prisma/client";

export type TrainingAwaitingSoreness = {
  id: number;
  completedAt: Date;
  daysAfter: number;
  muscles: {
    muscleId: number;
    muscleTitle: string;
    groupTitle: string;
    asAgonyCnt: number;
    asSynerCnt: number;
  }[];
};

export type UnderLoadedMuscle = {
  muscleId: number;
  muscleTitle: string;
  groupTitle: string;
  trainedCount: number;
  lowSorenessCount: number;
};

export type SuggestedExercise = {
  actionId: number;
  actionTitle: string;
  actionAlias: string | null;
  muscleId: number;
};

export async function findTrainingAwaitingSoreness(
  userId: string,
): Promise<TrainingAwaitingSoreness | null> {
  const { gte: todayStart } = getCurrentDayBorders();
  const threeDaysAgo = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate() - 3,
  );
  const oneDayAgo = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate() - 1,
  );

  const training = await prisma.training.findFirst({
    where: {
      userId,
      completedAt: { gte: threeDaysAgo, lt: todayStart },
      MuscleSoreness: null,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedAt: true,
    },
  });

  if (!training || !training.completedAt) return null;

  const muscleStats = await prisma.trainingMuscleStat.findMany({
    where: {
      trainingId: training.id,
      OR: [{ asAgonyCnt: { gt: 0 } }, { asSynerCnt: { gt: 0 } }],
    },
    include: {
      Muscle: { select: { title: true } },
      MuscleGroup: { select: { title: true } },
    },
    orderBy: [{ asAgonyCnt: "desc" }, { asSynerCnt: "desc" }],
  });

  if (muscleStats.length === 0) return null;

  const completedDate = new Date(
    training.completedAt.getFullYear(),
    training.completedAt.getMonth(),
    training.completedAt.getDate(),
  );
  const daysAfter = Math.round(
    (todayStart.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    id: training.id,
    completedAt: training.completedAt,
    daysAfter,
    muscles: muscleStats.map((s) => ({
      muscleId: s.muscleId,
      muscleTitle: s.Muscle.title,
      groupTitle: s.MuscleGroup.title,
      asAgonyCnt: s.asAgonyCnt,
      asSynerCnt: s.asSynerCnt,
    })),
  };
}

export async function findUnderLoadedMuscles(
  userId: string,
  trainingId: number,
): Promise<{ muscles: UnderLoadedMuscle[]; exercises: SuggestedExercise[] }> {
  // Get last 5 completed trainings with soreness data (excluding current)
  const recentTrainings = await prisma.training.findMany({
    where: {
      userId,
      completedAt: { not: null },
      id: { not: trainingId },
      MuscleSoreness: { isNot: null },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
    include: {
      TrainingMuscleStat: {
        where: { OR: [{ asAgonyCnt: { gt: 0 } }, { asSynerCnt: { gt: 0 } }] },
        include: {
          Muscle: { select: { title: true, Group: { select: { title: true } } } },
        },
      },
      MuscleSoreness: {
        include: {
          Entries: true,
        },
      },
    },
  });

  if (recentTrainings.length === 0) {
    return { muscles: [], exercises: [] };
  }

  // Track per-muscle stats: how many times trained, how many times low soreness
  const muscleStatsMap = new Map<
    number,
    {
      muscleId: number;
      muscleTitle: string;
      groupTitle: string;
      trainedCount: number;
      lowSorenessCount: number;
    }
  >();

  for (const training of recentTrainings) {
    const sorenessEntries = new Map(
      training.MuscleSoreness?.Entries.map((e) => [e.muscleId, e.intensity]) ??
        [],
    );

    for (const stat of training.TrainingMuscleStat) {
      const existing = muscleStatsMap.get(stat.muscleId);
      const intensity = sorenessEntries.get(stat.muscleId) ?? SorenessIntensity.NONE;
      const isLowSoreness =
        intensity === SorenessIntensity.NONE ||
        intensity === SorenessIntensity.LIGHT;

      if (existing) {
        existing.trainedCount++;
        if (isLowSoreness) existing.lowSorenessCount++;
      } else {
        muscleStatsMap.set(stat.muscleId, {
          muscleId: stat.muscleId,
          muscleTitle: stat.Muscle.title,
          groupTitle: stat.Muscle.Group.title,
          trainedCount: 1,
          lowSorenessCount: isLowSoreness ? 1 : 0,
        });
      }
    }
  }

  // Filter: muscles trained in at least 2 trainings with >50% low soreness
  const underLoaded = Array.from(muscleStatsMap.values())
    .filter((m) => m.trainedCount >= 2 && m.lowSorenessCount / m.trainedCount > 0.5)
    .sort((a, b) => b.lowSorenessCount / b.trainedCount - a.lowSorenessCount / a.trainedCount)
    .slice(0, 5);

  if (underLoaded.length === 0) {
    return { muscles: [], exercises: [] };
  }

  // Find exercises that target these muscles as agonists
  const underLoadedMuscleIds = underLoaded.map((m) => m.muscleId);
  const actions = await prisma.action.findMany({
    where: {
      MusclesAgony: {
        some: {
          muscleId: { in: underLoadedMuscleIds },
        },
      },
    },
    select: {
      id: true,
      title: true,
      alias: true,
      MusclesAgony: {
        where: { muscleId: { in: underLoadedMuscleIds } },
        select: { muscleId: true },
      },
    },
    orderBy: { base: "desc" },
    take: 10,
  });

  const exercises: SuggestedExercise[] = actions.flatMap((a) =>
    a.MusclesAgony.map((m) => ({
      actionId: a.id,
      actionTitle: a.title,
      actionAlias: a.alias,
      muscleId: m.muscleId,
    })),
  );

  return { muscles: underLoaded, exercises };
}
