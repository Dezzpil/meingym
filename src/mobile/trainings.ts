import { prisma } from "@/tools/db";

const PAGE_SIZE = 10;

// --- DTO Types ---

export type SetsMetrics = {
  len: number;
  weightSum: number;
  weightMean: number;
  weightMax: number;
  countSum: number;
  countMean: number;
};

export type MobileApproachDTO = {
  id: number;
  priority: number;
  weight: number;
  count: number;
  isBoost: boolean;
};

export type MobileExecutionDTO = {
  id: number;
  priority: number;
  plannedWeight: number;
  plannedCount: number;
  liftedWeight: number;
  liftedCount: number;
  isPassed: boolean;
  rating: string;
  technique: string;
  cheating: string;
  refusing: string;
  burning: string;
  executedAt: string | null;
  extraCount: number;
  useBelt: boolean;
  techniqueUpgrade: boolean;
};

export type MobileMuscleStatDTO = {
  muscleId: number;
  muscleTitle: string;
  groupTitle: string;
  asAgonyCnt: number;
  asSynerCnt: number;
  asStableCnt: number;
};

export type MobileExerciseDTO = {
  actionId: number;
  priority: number;
  isPassed: boolean;
  rating: string | null;
  planned: {
    approaches: MobileApproachDTO[];
    metrics: SetsMetrics;
  };
  executed: {
    approaches: MobileExecutionDTO[];
    skipped: MobileExecutionDTO[];
    metrics: SetsMetrics;
  } | null;
  previousRatings: { rating: string; date: string }[] | null;
};

export type MobileTrainingDTO = {
  id: number;
  plannedTo: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  isCircuit: boolean;
  withWarmUp: boolean;
  timeScoreInMins: number;
  durationMins: number | null;
  difficultyScore: number;
  muscles: MobileMuscleStatDTO[];
  exercises: MobileExerciseDTO[];
};

export type MobileTrainingsResponse = {
  meta: {
    total: number;
    nextCursor: number | null;
  };
  items: MobileTrainingDTO[];
};

// --- Helpers ---

function mapApproach(a: any): MobileApproachDTO {
  return {
    id: a.id,
    priority: a.priority,
    weight: a.weight,
    count: a.count,
    isBoost: a.isBoost,
  };
}

function mapExecution(e: any): MobileExecutionDTO {
  return {
    id: e.id,
    priority: e.priority,
    plannedWeight: e.plannedWeigth,
    plannedCount: e.plannedCount,
    liftedWeight: e.liftedWeight,
    liftedCount: e.liftedCount,
    isPassed: e.isPassed,
    rating: String(e.rating),
    technique: String(e.technique),
    cheating: String(e.cheating),
    refusing: String(e.refusing),
    burning: String(e.burning),
    executedAt: e.executedAt?.toISOString() ?? null,
    extraCount: e.extraCount,
    useBelt: e.useBelt,
    techniqueUpgrade: e.techniqueUpgrade,
  };
}

function mapMuscleStat(s: any): MobileMuscleStatDTO {
  return {
    muscleId: s.muscleId,
    muscleTitle: s.Muscle.title,
    groupTitle: s.MuscleGroup.title,
    asAgonyCnt: s.asAgonyCnt,
    asSynerCnt: s.asSynerCnt,
    asStableCnt: s.asStableCnt,
  };
}

function sortMuscleStats(stats: MobileMuscleStatDTO[]): MobileMuscleStatDTO[] {
  return stats.sort((a, b) => {
    const totalA = a.asAgonyCnt + a.asSynerCnt + a.asStableCnt;
    const totalB = b.asAgonyCnt + b.asSynerCnt + b.asStableCnt;
    if (totalB !== totalA) return totalB - totalA;

    const roleA = a.asAgonyCnt > 0 ? 2 : a.asSynerCnt > 0 ? 1 : 0;
    const roleB = b.asAgonyCnt > 0 ? 2 : b.asSynerCnt > 0 ? 1 : 0;
    if (roleB !== roleA) return roleB - roleA;

    if (b.asAgonyCnt !== a.asAgonyCnt) return b.asAgonyCnt - a.asAgonyCnt;
    if (b.asSynerCnt !== a.asSynerCnt) return b.asSynerCnt - a.asSynerCnt;
    if (b.asStableCnt !== a.asStableCnt) return b.asStableCnt - a.asStableCnt;

    return a.muscleTitle.localeCompare(b.muscleTitle);
  });
}

// --- Main function ---

export async function getTrainingsList(
  userId: string,
  since: Date,
  cursor?: number,
): Promise<MobileTrainingsResponse> {
  // Query 1 + Query 2 in parallel
  const [trainings, total] = await Promise.all([
    prisma.training.findMany({
      where: {
        userId,
        plannedTo: { gte: since },
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      take: PAGE_SIZE + 1,
      orderBy: { id: "asc" },
      include: {
        TrainingExercise: {
          orderBy: { priority: "asc" },
          include: {
            Action: { select: { id: true } },
            ApproachGroup: {
              include: { Approaches: { orderBy: { priority: "asc" } } },
            },
            TrainingExerciseExecution: true,
          },
        },
        TrainingMuscleStat: {
          include: {
            Muscle: { select: { title: true } },
            MuscleGroup: { select: { title: true } },
          },
        },
      },
    }),
    prisma.training.count({
      where: { userId, plannedTo: { gte: since } },
    }),
  ]);

  const hasMore = trainings.length > PAGE_SIZE;
  const items = hasMore ? trainings.slice(0, PAGE_SIZE) : trainings;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Query 3: previous ratings batch
  const completedExercises = items.flatMap((t: any) =>
    t.TrainingExercise.filter((e: any) => e.completedAt != null),
  );
  const uniqueActionIds = [
    ...new Set(completedExercises.map((e: any) => e.actionId)),
  ];

  let prevRatingsMap = new Map<number, { rating: string; date: string }[]>();

  if (uniqueActionIds.length > 0) {
    const maxPlannedTo = new Date(
      Math.max(...items.map((t: any) => new Date(t.plannedTo).getTime())),
    );

    const prevRatingsRaw = await prisma.trainingExercise.findMany({
      where: {
        actionId: { in: uniqueActionIds },
        completedAt: { not: null },
        Training: { userId, plannedTo: { lt: maxPlannedTo } },
      },
      orderBy: { Training: { plannedTo: "desc" } },
      take: 500,
      select: {
        actionId: true,
        rating: true,
        Training: { select: { plannedTo: true } },
      },
    });

    for (const row of prevRatingsRaw) {
      const entry = { rating: String(row.rating), date: row.Training.plannedTo.toISOString() };
      const arr = prevRatingsMap.get(row.actionId);
      if (arr) {
        arr.push(entry);
      } else {
        prevRatingsMap.set(row.actionId, [entry]);
      }
    }
  }

  // DTO mapping
  const dtos: MobileTrainingDTO[] = items.map((t: any) => {
    const trainingPlannedToIso = t.plannedTo.toISOString();

    const exercises: MobileExerciseDTO[] = t.TrainingExercise.map((ex: any) => {
      const approachGroup = ex.ApproachGroup;
      const approaches = approachGroup.Approaches;

      const plannedApproaches: MobileApproachDTO[] = approaches.map(mapApproach);
      const plannedMetrics: SetsMetrics = {
        len: approachGroup.count,
        weightSum: approachGroup.sum,
        weightMean: approachGroup.mean,
        weightMax: approachGroup.max,
        countSum: approachGroup.countTotal,
        countMean: approachGroup.countMean,
      };

      const executions: any[] = ex.TrainingExerciseExecution;
      let executed: MobileExerciseDTO["executed"] = null;

      if (executions.length > 0) {
        const passed = executions.filter((e: any) => e.isPassed === true);
        const skipped = executions.filter((e: any) => e.isPassed === false);
        executed = {
          approaches: passed.map(mapExecution),
          skipped: skipped.map(mapExecution),
          metrics: {
            len: passed.length,
            weightSum: ex.liftedSum,
            weightMean: ex.liftedMean,
            weightMax: ex.liftedMax,
            countSum: ex.liftedCountTotal,
            countMean: ex.liftedCountMean,
          },
        };
      }

      const rating = ex.completedAt ? ex.rating : null;

      let previousRatings: { rating: string; date: string }[] | null = null;
      if (rating != null) {
        const prev = prevRatingsMap.get(ex.Action.id);
        if (prev) {
          const filtered = prev.filter((p) => p.date < trainingPlannedToIso).slice(0, 5);
          previousRatings = filtered.length > 0 ? filtered : null;
        }
      }

      return {
        actionId: ex.Action.id,
        priority: ex.priority,
        isPassed: ex.isPassed,
        rating: rating ? String(rating) : null,
        planned: { approaches: plannedApproaches, metrics: plannedMetrics },
        executed,
        previousRatings,
      } satisfies MobileExerciseDTO;
    });

    const durationMins =
      t.startedAt && t.completedAt
        ? Math.round((new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()) / 60000)
        : null;

    const muscles = sortMuscleStats(t.TrainingMuscleStat.map(mapMuscleStat));

    return {
      id: t.id,
      plannedTo: t.plannedTo.toISOString(),
      createdAt: t.createdAt.toISOString(),
      startedAt: t.startedAt?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      isCircuit: t.isCircuit,
      withWarmUp: !t.noWarmUp,
      timeScoreInMins: t.timeScoreInMins,
      durationMins,
      difficultyScore: t.difficultyScore,
      muscles,
      exercises,
    } satisfies MobileTrainingDTO;
  });

  return { meta: { total, nextCursor }, items: dtos };
}
