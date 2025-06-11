import { prisma } from "@/tools/db";
import type {
  Purpose,
  TrainingExercise,
  TrainingExerciseScore,
} from "@prisma/client";

export type ActionHistoryDataNormalized = {
  liftedSumNorm: number;
  liftedMeanNorm: number;
  liftedMaxNorm: number;
  liftedCountTotalNorm: number;
  liftedCountMeanNorm: number;
};

export type DataRows = {
  liftedSumNorm: number[];
  liftedMeanNorm: number[];
  liftedMaxNorm: number[];
  liftedCountTotalNorm: number[];
  liftedCountMeanNorm: number[];
};

export function normLogFn(val: number): number {
  return val > 0 ? Math.log(val) : 0;
}

export const norm = (item: TrainingExercise): ActionHistoryDataNormalized => {
  return {
    liftedMaxNorm: normLogFn(item.liftedMax),
    liftedSumNorm: normLogFn(item.liftedSum),
    liftedMeanNorm: normLogFn(item.liftedMean),
    liftedCountTotalNorm: normLogFn(item.liftedCountTotal),
    liftedCountMeanNorm: normLogFn(item.liftedCountMean),
  };
};

export const scoreNormalized = (
  purpose: Purpose,
  data: ActionHistoryDataNormalized,
) => {
  const coefficients = ScoreCoefficients[purpose as Purpose];
  let score = 0;
  for (const key in coefficients) {
    const k = key as keyof ActionHistoryDataNormalized;
    if (data[k]) {
      score += data[k] * coefficients[k];
    }
  }
  return { score, coefficients } as const;
};

export const ScoreCoefficients: Record<
  Purpose,
  Record<keyof DataRows, number>
> = {
  STRENGTH: {
    liftedMaxNorm: 0.5,
    liftedSumNorm: 0.5,
    liftedMeanNorm: 0,
    liftedCountTotalNorm: 0,
    liftedCountMeanNorm: -0.5,
  },
  MASS: {
    liftedMeanNorm: 0.5,
    liftedCountMeanNorm: 0.25,
    liftedSumNorm: 0.25,
    liftedCountTotalNorm: 0,
    liftedMaxNorm: 0.1,
  },
  LOSS: {
    liftedCountTotalNorm: 0.5,
    liftedCountMeanNorm: 0.5,
    liftedMaxNorm: 0.5,
    liftedMeanNorm: 0,
    liftedSumNorm: 0,
  },
};

export async function createScore(
  exercise: TrainingExercise & { Training: { userId: string } },
): Promise<TrainingExerciseScore> {
  const normalized = norm(exercise);
  const { score, coefficients } = scoreNormalized(exercise.purpose, normalized);

  return prisma.trainingExerciseScore.create({
    data: {
      createdAt: exercise.completedAt || new Date(),
      userId: exercise.Training.userId,
      actionId: exercise.actionId,
      purpose: exercise.purpose,
      liftedSumNorm: normalized.liftedSumNorm,
      liftedMeanNorm: normalized.liftedMeanNorm,
      liftedMaxNorm: normalized.liftedMaxNorm,
      liftedCountTotalNorm: normalized.liftedCountTotalNorm,
      liftedCountMeanNorm: normalized.liftedCountMeanNorm,
      trainingExerciseId: exercise.id,
      score,
      coefficients,
    },
  });
}
