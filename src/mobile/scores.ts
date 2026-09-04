import { prisma } from "@/tools/db";
import { calculateStats } from "@/core/stats";
import { calculateExerciseDifficulty } from "@/core/difficulty";
import { estimateExerciseTimeInMins } from "@/core/trainingTime/estimate";
import type { CurrentPurpose, SetData } from "@/core/types";
import { ActionRig, Purpose } from "@prisma/client";

export const MAX_EXERCISES_PER_REQUEST = 50;

/** Ошибка входных данных расчёта: роут отдаёт её как 400 */
export class MobileScoresInputError extends Error {}

// --- DTO Types ---

export type MobileScoreApproachInput = {
  weight: number;
  count: number;
};

export type MobileScoreExerciseInput = {
  /** ID упражнения из справочника `GET /api/mobile/v1/exercises` */
  id: number;
  purpose: CurrentPurpose;
  approaches: MobileScoreApproachInput[];
};

export type MobileExerciseScoreDTO = {
  id: number;
  /** цель, по которой посчитаны оценки (для duration-упражнений всегда LOSS) */
  purpose: Purpose;
  approachesCount: number;
  timeScoreInMins: number;
  timeScoreInSecs: number;
  difficultyScore: number;
};

export type MobileTrainingScoresDTO = {
  timeScoreInMins: number;
  timeScoreInSecs: number;
  difficultyScore: number;
  exercises: MobileExerciseScoreDTO[];
};

type ScoreAction = {
  id: number;
  base: number;
  rig: ActionRig;
  isDurationBased: boolean;
};

// --- Helpers ---

async function loadActionsForScoring(
  exercises: MobileScoreExerciseInput[],
): Promise<Map<number, ScoreAction>> {
  const actionIds = [...new Set(exercises.map((exercise) => exercise.id))];
  const actions = await prisma.action.findMany({
    where: { id: { in: actionIds } },
    select: { id: true, base: true, rig: true, isDurationBased: true },
  });

  const actionsById = new Map<number, ScoreAction>(
    actions.map((action) => [action.id, action]),
  );

  const missingIds = actionIds.filter((id) => !actionsById.has(id));
  if (missingIds.length) {
    throw new MobileScoresInputError(
      `Unknown exercise ids: ${missingIds.join(", ")}`,
    );
  }

  return actionsById;
}

/**
 * Вес тела нужен только для упражнений с собственным весом (rig = OTHER)
 * и не «на длительность» — там он участвует в статистике подходов.
 */
async function loadUserWeightIfRequired(
  userId: string,
  actions: ScoreAction[],
): Promise<number> {
  const isRequired = actions.some(
    (action) => action.rig === ActionRig.OTHER && !action.isDurationBased,
  );
  if (!isRequired) return 0;

  const weight = await prisma.weight.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  if (!weight) {
    throw new MobileScoresInputError(
      "User has no weight records required for bodyweight exercises",
    );
  }

  return weight.value;
}

// --- Main function ---

/**
 * Предварительные оценки тренировки (время и сложность) по упражнениям,
 * которые мобильное приложение собирается в неё включить.
 * Расчёт чистый: ничего не создаёт и не обновляет в БД.
 */
export async function calculateTrainingScores(
  userId: string,
  exercises: MobileScoreExerciseInput[],
): Promise<MobileTrainingScoresDTO> {
  const actionsById = await loadActionsForScoring(exercises);
  const userWeight = await loadUserWeightIfRequired(
    userId,
    [...actionsById.values()],
  );

  const items = exercises.map((exercise) => {
    const action = actionsById.get(exercise.id)!;
    // упражнения «на длительность» не делятся по цели — всегда LOSS (см. createExercise)
    const purpose: Purpose = action.isDurationBased
      ? Purpose.LOSS
      : exercise.purpose;

    const stats = calculateStats(
      exercise.approaches as SetData[],
      action.rig,
      userWeight,
      action.isDurationBased,
    );
    const timeScoreInMins = estimateExerciseTimeInMins(
      purpose,
      exercise.approaches.length,
    );
    const difficultyScore = calculateExerciseDifficulty({
      action: { base: action.base },
      approachGroup: {
        sum: stats.weightSum,
        mean: stats.weightMean,
        max: stats.weightMax,
        countTotal: stats.countSum,
        countMean: stats.countMean,
      },
      purpose,
    });

    return {
      id: exercise.id,
      purpose,
      approachesCount: exercise.approaches.length,
      timeScoreInMins,
      timeScoreInSecs: timeScoreInMins * 60,
      difficultyScore,
    };
  });

  const timeScoreInMins = items.reduce(
    (sum, item) => sum + item.timeScoreInMins,
    0,
  );

  return {
    timeScoreInMins,
    timeScoreInSecs: timeScoreInMins * 60,
    difficultyScore: items.reduce(
      (sum, item) => sum + item.difficultyScore,
      0,
    ),
    exercises: items,
  };
}
