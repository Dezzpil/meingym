import type { Training } from "@prisma/client";

export type TrainingDynamics = {
  trainingId: number;
  absoluteDifficulty: number;
  relativeToMean: number | null; // процент: +15 = на 15% сложнее среднего, -8 = легче
  meanDifficulty: number | null;
  sparkline: number[]; // последние N тренировок с той же подписью, от старой к новой
  hasEnoughData: boolean;
};

const MIN_TRAININGS_FOR_SPARKLINE = 3;
const SPARKLINE_MAX_POINTS = 8;

export function computeTrainingDynamics(
  training: Pick<Training, "id" | "difficultyScore" | "muscleSignature">,
  allTrainings: Pick<Training, "id" | "difficultyScore" | "muscleSignature" | "plannedTo">[],
): TrainingDynamics {
  const { id, difficultyScore, muscleSignature } = training;

  if (!muscleSignature || difficultyScore <= 0) {
    return {
      trainingId: id,
      absoluteDifficulty: difficultyScore,
      relativeToMean: null,
      meanDifficulty: null,
      sparkline: [],
      hasEnoughData: false,
    };
  }

  // Все тренировки с той же подписью, отсортированные по дате
  const sameSignature = allTrainings
    .filter((t) => t.muscleSignature === muscleSignature && t.difficultyScore > 0)
    .sort((a, b) => new Date(a.plannedTo).getTime() - new Date(b.plannedTo).getTime());

  if (sameSignature.length < MIN_TRAININGS_FOR_SPARKLINE) {
    return {
      trainingId: id,
      absoluteDifficulty: difficultyScore,
      relativeToMean: null,
      meanDifficulty: null,
      sparkline: sameSignature.map((t) => t.difficultyScore),
      hasEnoughData: false,
    };
  }

  // Среднее за все тренировки с этой подписью (кроме текущей)
  const others = sameSignature.filter((t) => t.id !== id);
  const mean = others.length
    ? others.reduce((sum, t) => sum + t.difficultyScore, 0) / others.length
    : difficultyScore;

  const relativeToMean = mean > 0 ? ((difficultyScore - mean) / mean) * 100 : null;

  // Спарклайн: последние N точек, включая текущую
  const recentTrainings = sameSignature.slice(-SPARKLINE_MAX_POINTS);
  const sparkline = recentTrainings.map((t) => t.difficultyScore);

  return {
    trainingId: id,
    absoluteDifficulty: difficultyScore,
    relativeToMean,
    meanDifficulty: mean,
    sparkline,
    hasEnoughData: true,
  };
}

export function computeBatchDynamics(
  trainings: Pick<Training, "id" | "difficultyScore" | "muscleSignature" | "plannedTo">[],
): Map<number, TrainingDynamics> {
  const result = new Map<number, TrainingDynamics>();
  for (const training of trainings) {
    result.set(training.id, computeTrainingDynamics(training, trainings));
  }
  return result;
}
