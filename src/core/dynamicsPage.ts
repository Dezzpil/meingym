import type { Training, TrainingPeriod, PersonalRecord, TrainingMuscleLoad } from "@prisma/client";
import moment from "moment";

export type TrainingWithDynamics = Pick<
  Training,
  "id" | "plannedTo" | "completedAt" | "difficultyScore" | "executedDifficultyScore" | "muscleSignature"
> & {
  Period?: Pick<TrainingPeriod, "id" | "startDate" | "endDate"> | null;
  PersonalRecords?: Pick<PersonalRecord, "id" | "achievedAt">[];
};

export type ProcessLinePoint = {
  trainingId: number;
  plannedTo: Date;
  plannedDifficulty: number;
  executedDifficulty: number | null;
  hasPersonalRecord: boolean;
  periodBoundary: "start" | "end" | null;
  weekNumber: number;
};

export type HeatmapCell = {
  muscleGroupId: number;
  muscleGroupTitle: string;
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  plannedLoad: number;
  executedLoad: number;
  hasRecoveryConflict: boolean; // тренировка на эту группу была меньше 72 часов назад
};

export type LikeForLikeComparison = {
  currentTrainingId: number;
  previousTrainingId: number | null;
  muscleSignature: string;
  currentDifficulty: number;
  previousDifficulty: number | null;
  delta: number | null; // процент
  daysBetween: number | null;
};

const RECOVERY_WINDOW_HOURS = 72;

export function computeProcessLine(
  trainings: TrainingWithDynamics[],
): ProcessLinePoint[] {
  if (!trainings.length) return [];

  const sorted = [...trainings].sort(
    (a, b) => new Date(a.plannedTo).getTime() - new Date(b.plannedTo).getTime(),
  );

  const firstWeekStart = moment(sorted[0].plannedTo).startOf("week").toDate();

  return sorted.map((t, index) => {
    const weekNumber = Math.floor(
      moment(t.plannedTo).diff(firstWeekStart, "weeks"),
    );

    const periodBoundary = t.Period
      ? moment(t.plannedTo).isSame(t.Period.startDate, "day")
        ? "start"
        : t.Period.endDate && moment(t.plannedTo).isSame(t.Period.endDate, "day")
        ? "end"
        : null
      : null;

    return {
      trainingId: t.id,
      plannedTo: t.plannedTo,
      plannedDifficulty: t.difficultyScore,
      executedDifficulty: t.executedDifficultyScore > 0 ? t.executedDifficultyScore : null,
      hasPersonalRecord: (t.PersonalRecords?.length ?? 0) > 0,
      periodBoundary,
      weekNumber,
    };
  });
}

export function compute4WeekMovingAverage(points: ProcessLinePoint[]): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i < 3) {
      result.push(null);
    } else {
      const window = [points[i - 3], points[i - 2], points[i - 1], points[i]];
      const executed = window.filter((p) => p.executedDifficulty !== null);
      if (executed.length < 2) {
        result.push(null);
      } else {
        const avg =
          executed.reduce((sum, p) => sum + (p.executedDifficulty ?? 0), 0) /
          executed.length;
        result.push(avg);
      }
    }
  }
  return result;
}

export function computeHeatmap(
  trainings: TrainingWithDynamics[],
  muscleGroupLoads: {
    trainingId: number;
    muscleGroupId: number;
    muscleGroupTitle: string;
    plannedLoad: number;
    executedLoad: number;
  }[],
): HeatmapCell[] {
  if (!trainings.length) return [];

  const sorted = [...trainings].sort(
    (a, b) => new Date(a.plannedTo).getTime() - new Date(b.plannedTo).getTime(),
  );

  const firstWeekStart = moment(sorted[0].plannedTo).startOf("week").toDate();
  const lastWeekEnd = moment(sorted[sorted.length - 1].plannedTo).endOf("week").toDate();

  const weeks: { weekNumber: number; start: Date; end: Date }[] = [];
  let currentWeekStart = firstWeekStart;
  let weekNumber = 0;
  while (currentWeekStart <= lastWeekEnd) {
    weeks.push({
      weekNumber,
      start: currentWeekStart,
      end: moment(currentWeekStart).endOf("week").toDate(),
    });
    currentWeekStart = moment(currentWeekStart).add(1, "week").toDate();
    weekNumber++;
  }

  const muscleGroupIds = Array.from(
    new Set(muscleGroupLoads.map((l) => l.muscleGroupId)),
  );

  const cells: HeatmapCell[] = [];

  for (const mgId of muscleGroupIds) {
    const mgTitle =
      muscleGroupLoads.find((l) => l.muscleGroupId === mgId)?.muscleGroupTitle ??
      `Группа ${mgId}`;

    for (const week of weeks) {
      const trainingsInWeek = sorted.filter(
        (t) =>
          moment(t.plannedTo).isBetween(week.start, week.end, null, "[]"),
      );

      let plannedLoad = 0;
      let executedLoad = 0;
      let hasRecoveryConflict = false;

      for (const t of trainingsInWeek) {
        const loads = muscleGroupLoads.filter((l) => l.trainingId === t.id && l.muscleGroupId === mgId);
        for (const l of loads) {
          plannedLoad += l.plannedLoad;
          executedLoad += l.executedLoad;
        }

        // Проверка окна восстановления: если предыдущая тренировка на эту группу была < 72 часов назад
        const prevTrainingOnGroup = sorted.find(
          (prev) =>
            prev.id !== t.id &&
            new Date(prev.plannedTo) < new Date(t.plannedTo) &&
            muscleGroupLoads.some(
              (l) => l.trainingId === prev.id && l.muscleGroupId === mgId,
            ),
        );
        if (prevTrainingOnGroup) {
          const hoursBetween = moment(t.plannedTo).diff(
            prevTrainingOnGroup.plannedTo,
            "hours",
          );
          if (hoursBetween < RECOVERY_WINDOW_HOURS) {
            hasRecoveryConflict = true;
          }
        }
      }

      cells.push({
        muscleGroupId: mgId,
        muscleGroupTitle: mgTitle,
        weekNumber: week.weekNumber,
        weekStart: week.start,
        weekEnd: week.end,
        plannedLoad,
        executedLoad,
        hasRecoveryConflict,
      });
    }
  }

  return cells;
}

export function computeLikeForLikeComparisons(
  trainings: TrainingWithDynamics[],
): LikeForLikeComparison[] {
  const sorted = [...trainings].sort(
    (a, b) => new Date(a.plannedTo).getTime() - new Date(b.plannedTo).getTime(),
  );

  const bySignature = new Map<string, TrainingWithDynamics[]>();
  for (const t of sorted) {
    if (!t.muscleSignature) continue;
    if (!bySignature.has(t.muscleSignature)) {
      bySignature.set(t.muscleSignature, []);
    }
    bySignature.get(t.muscleSignature)!.push(t);
  }

  const comparisons: LikeForLikeComparison[] = [];

  for (const [signature, group] of bySignature) {
    for (let i = 1; i < group.length; i++) {
      const current = group[i];
      const previous = group[i - 1];

      const daysBetween = moment(current.plannedTo).diff(
        previous.plannedTo,
        "days",
      );

      const delta =
        previous.executedDifficultyScore > 0
          ? ((current.executedDifficultyScore - previous.executedDifficultyScore) /
              previous.executedDifficultyScore) *
            100
          : null;

      comparisons.push({
        currentTrainingId: current.id,
        previousTrainingId: previous.id,
        muscleSignature: signature,
        currentDifficulty: current.executedDifficultyScore,
        previousDifficulty:
          previous.executedDifficultyScore > 0
            ? previous.executedDifficultyScore
            : null,
        delta,
        daysBetween,
      });
    }
  }

  return comparisons.sort(
    (a, b) =>
      new Date(
        sorted.find((t) => t.id === a.currentTrainingId)!.plannedTo,
      ).getTime() -
      new Date(
        sorted.find((t) => t.id === b.currentTrainingId)!.plannedTo,
      ).getTime(),
  );
}
