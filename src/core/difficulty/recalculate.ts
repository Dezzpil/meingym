"use server";

import { prisma } from "@/tools/db";
import { calculateExerciseDifficulty } from "@/core/difficulty";

/**
 * Пересчитать сложность одного упражнения и обновить в БД.
 * Возвращает новое значение difficultyScore.
 */
export async function recalculateExerciseDifficulty(exerciseId: number): Promise<number> {
  const exercise = await prisma.trainingExercise.findUniqueOrThrow({
    where: { id: exerciseId },
    include: {
      Action: { select: { base: true } },
      ApproachGroup: true,
    },
  });

  const difficulty = calculateExerciseDifficulty({
    action: exercise.Action,
    approachGroup: exercise.ApproachGroup,
    purpose: exercise.purpose,
  });

  await prisma.trainingExercise.update({
    where: { id: exerciseId },
    data: { difficultyScore: difficulty },
  });

  return difficulty;
}

/**
 * Пересчитать сложность всей тренировки (сумма сложностей упражнений) и обновить в БД.
 */
export async function recalculateTrainingDifficulty(trainingId: number): Promise<number> {
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId },
    select: { difficultyScore: true },
  });

  const totalDifficulty = exercises.reduce((sum, ex) => sum + ex.difficultyScore, 0);

  await prisma.training.update({
    where: { id: trainingId },
    data: { difficultyScore: totalDifficulty },
  });

  return totalDifficulty;
}

/**
 * Пересчитать сложность одного упражнения и затем пересчитать сложность всей тренировки.
 */
export async function recalculateExerciseAndTrainingDifficulty(
  exerciseId: number,
  trainingId: number,
): Promise<{ exerciseDifficulty: number; trainingDifficulty: number }> {
  const exerciseDifficulty = await recalculateExerciseDifficulty(exerciseId);
  const trainingDifficulty = await recalculateTrainingDifficulty(trainingId);
  return { exerciseDifficulty, trainingDifficulty };
}
