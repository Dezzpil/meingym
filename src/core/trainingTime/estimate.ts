import { Purpose } from "@prisma/client";

/** Норматив времени на один подход в минутах в зависимости от цели */
export const PurposesToMinsMap: Record<Purpose, number> = {
  [Purpose.STRENGTH]: 5,
  [Purpose.MASS]: 3.5,
  [Purpose.LOSS]: 2,
};

/**
 * Оценка времени выполнения упражнения в минутах = норматив цели × количество подходов.
 */
export function estimateExerciseTimeInMins(
  purpose: Purpose,
  approachesCount: number,
): number {
  return (PurposesToMinsMap[purpose] || 0) * approachesCount || 0;
}
