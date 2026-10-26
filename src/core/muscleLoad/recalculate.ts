import { prisma } from "@/tools/db";
import type { PrismaTransactionClient } from "@/tools/types";
import {
  buildMuscleSignature,
  distributeExerciseLoad,
  executedExerciseDifficulty,
  type GroupLoad,
  type LoadMuscle,
} from "@/core/muscleLoad";

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Пересчитать нагрузку по группам мышц тренировки и фактическую сложность.
 * Плановая часть берётся из `difficultyScore` упражнений — те же слагаемые,
 * что у `Training.difficultyScore`, поэтому нить и линия процесса сходятся.
 */
export async function recomputeTrainingMuscleLoad(
  trainingId: number,
  tx?: PrismaTransactionClient,
): Promise<{ executedDifficulty: number; groups: number }> {
  const db = tx ?? prisma;

  const training = await db.training.findUniqueOrThrow({
    where: { id: trainingId },
    select: { userId: true },
  });

  const exercises = await db.trainingExercise.findMany({
    where: { trainingId },
    select: {
      purpose: true,
      difficultyScore: true,
      liftedSum: true,
      liftedMean: true,
      liftedMax: true,
      liftedCountTotal: true,
      liftedCountMean: true,
      Action: {
        select: {
          base: true,
          MusclesAgony: {
            select: {
              Muscle: { select: { groupId: true, sizeFactor: true } },
            },
          },
          MusclesSynergy: {
            select: {
              Muscle: { select: { groupId: true, sizeFactor: true } },
            },
          },
        },
      },
    },
  });

  const acc = new Map<number, GroupLoad>();
  const agonistGroups: number[] = [];
  let executedDifficulty = 0;

  for (const exercise of exercises) {
    const toLoadMuscles = (
      links: { Muscle: { groupId: number; sizeFactor: number } }[],
    ): LoadMuscle[] =>
      links.map((link) => ({
        groupId: link.Muscle.groupId,
        sizeFactor: link.Muscle.sizeFactor,
      }));

    const executed = executedExerciseDifficulty(
      exercise.Action.base,
      exercise,
      exercise.purpose,
    );
    executedDifficulty += executed;

    for (const group of distributeExerciseLoad({
      planned: exercise.difficultyScore,
      executed,
      agony: toLoadMuscles(exercise.Action.MusclesAgony),
      synergy: toLoadMuscles(exercise.Action.MusclesSynergy),
    })) {
      if (group.agonyCnt > 0) agonistGroups.push(group.groupId);

      const existed = acc.get(group.groupId);
      if (!existed) {
        acc.set(group.groupId, { ...group });
        continue;
      }
      existed.planned += group.planned;
      existed.executed += group.executed;
      existed.agonyCnt += group.agonyCnt;
      existed.synergyCnt += group.synergyCnt;
    }
  }

  const rows = Array.from(acc.values());

  await db.trainingMuscleLoad.deleteMany({ where: { trainingId } });
  if (rows.length) {
    await db.trainingMuscleLoad.createMany({
      data: rows.map((row) => ({
        trainingId,
        muscleGroupId: row.groupId,
        userId: training.userId,
        plannedLoad: round(row.planned),
        executedLoad: round(row.executed),
        agonyCnt: row.agonyCnt,
        synergyCnt: row.synergyCnt,
      })),
    });
  }

  await db.training.update({
    where: { id: trainingId },
    data: {
      executedDifficultyScore: round(executedDifficulty),
      muscleSignature: buildMuscleSignature(agonistGroups),
    },
  });

  return { executedDifficulty: round(executedDifficulty), groups: rows.length };
}
