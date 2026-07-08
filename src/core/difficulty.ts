import type { Action, ApproachesGroup, Purpose } from "@prisma/client";
import { previewScore } from "@/core/scores";

export type ExerciseDifficultyInput = {
  action: Pick<Action, "base">;
  approachGroup: Pick<ApproachesGroup, "sum" | "mean" | "max" | "countTotal" | "countMean">;
  purpose: Purpose;
};

/**
 * Сложность выполнения упражнения = Базовость движения × предварительная оценка
 */
export function calculateExerciseDifficulty(input: ExerciseDifficultyInput): number {
  return input.action.base * previewScore(input.purpose, input.approachGroup);
}

/**
 * Сложность тренировки = сумма сложностей всех упражнений
 */
export function calculateTrainingDifficulty(exercises: ExerciseDifficultyInput[]): number {
  return exercises.reduce((sum, ex) => sum + calculateExerciseDifficulty(ex), 0);
}
