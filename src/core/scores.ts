import { norm, scoreNormalized } from "@/core/progression/scores";
import { prisma } from "@/tools/db";
import type { TrainingExercise, TrainingExerciseScore } from "@prisma/client";

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
      liftedMaxNorm: normalized.maxWeightNorm,
      liftedCountTotalNorm: normalized.liftedCountTotalNorm,
      trainingExerciseId: exercise.id,
      score,
      coefficients,
    },
  });
}
