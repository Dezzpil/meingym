import { Purpose } from "@prisma/client";

export type DataRows = {
  liftedSumNorm: number[];
  liftedMeanNorm: number[];
  liftedCountTotalNorm: number[];
  maxWeightNorm: number[];
};

export const Scores: Record<Purpose, Record<keyof DataRows, number>> = {
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
    const scoreCoefficients = Scores[purpose as Purpose];
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
