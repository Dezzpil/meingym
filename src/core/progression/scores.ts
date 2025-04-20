import { Purpose, TrainingExercise } from "@prisma/client";

export type ActionHistoryDataNormalized = {
  liftedSumNorm: number;
  liftedMeanNorm: number;
  liftedCountTotalNorm: number;
  maxWeightNorm: number;
};

export type DataRows = {
  liftedSumNorm: number[];
  liftedMeanNorm: number[];
  liftedCountTotalNorm: number[];
  maxWeightNorm: number[];
};

export function normLogFn(val: number): number {
  return val > 0 ? Math.log(val) : 0;
}

export const norm = (item: TrainingExercise): ActionHistoryDataNormalized => {
  return {
    maxWeightNorm: normLogFn(item.liftedMax),
    liftedSumNorm: normLogFn(item.liftedSum),
    liftedMeanNorm: normLogFn(item.liftedMean),
    liftedCountTotalNorm: normLogFn(item.liftedCountTotal),
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
  MASS: {
    liftedMeanNorm: 0.5,
    maxWeightNorm: 0.4,
    liftedSumNorm: 0.05,
    liftedCountTotalNorm: 0.05,
  },
  STRENGTH: {
    maxWeightNorm: 0.5,
    liftedSumNorm: 0.4,
    liftedMeanNorm: 0.05,
    liftedCountTotalNorm: 0.05,
  },
  LOSS: {
    liftedCountTotalNorm: 0.5,
    liftedSumNorm: 0.4,
    liftedMeanNorm: 0.05,
    maxWeightNorm: 0.05,
  },
};

export function score(dataRows: Record<Purpose, DataRows>, n: number) {
  const result: Record<Purpose, number[]> = {
    MASS: [],
    LOSS: [],
    STRENGTH: [],
  };
  for (const purpose in dataRows) {
    const data = dataRows[purpose as Purpose];
    const scoreCoefficients = ScoreCoefficients[purpose as Purpose];
    const scores = [];
    for (let i = 0; i < n; i++) {
      let score = 0;
      for (const key in scoreCoefficients) {
        const k = key as keyof DataRows;
        if (data[k][i]) {
          score += data[k][i] * scoreCoefficients[k];
        }
      }
      scores.push(score);
    }
    result[purpose as Purpose] = scores;
  }
  return result;
}
