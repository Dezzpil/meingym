import { prisma } from "@/tools/db";
import type { PrismaTransactionClient } from "@/tools/types";

export async function recomputeTrainingMuscleStats(
  trainingId: number,
  tx?: PrismaTransactionClient,
) {
  const db = tx ?? prisma;

  // Ensure training is not started; if started, do nothing
  const training = await db.training.findUniqueOrThrow({
    where: { id: trainingId },
    select: { startedAt: true },
  });
  if (training.startedAt) return;

  // Load all exercises with action muscles relations
  const exercises = await db.trainingExercise.findMany({
    where: { trainingId },
    select: {
      id: true,
      actionId: true,
      Action: {
        select: {
          MusclesAgony: {
            select: { muscleId: true, Muscle: { select: { groupId: true } } },
          },
          MusclesSynergy: {
            select: { muscleId: true, Muscle: { select: { groupId: true } } },
          },
          MusclesStabilizer: {
            select: { muscleId: true, Muscle: { select: { groupId: true } } },
          },
        },
      },
    },
  });

  type Acc = {
    muscleId: number;
    muscleGroupId: number;
    asAgonyCnt: number;
    asSynerCnt: number;
    asStableCnt: number;
  };

  const acc = new Map<number, Acc>();

  for (const ex of exercises) {
    const action = ex.Action as any;

    const push = (
      muscleId: number,
      groupId: number,
      role: "agony" | "synergy" | "stabilizer",
    ) => {
      let item = acc.get(muscleId);
      if (!item) {
        item = {
          muscleId,
          muscleGroupId: groupId,
          asAgonyCnt: 0,
          asSynerCnt: 0,
          asStableCnt: 0,
        };
        acc.set(muscleId, item);
      }
      if (role === "agony") item.asAgonyCnt++;
      if (role === "synergy") item.asSynerCnt++;
      if (role === "stabilizer") item.asStableCnt++;
    };

    for (const m of action.MusclesAgony ?? []) {
      push(m.muscleId, m.Muscle.groupId, "agony");
    }
    for (const m of action.MusclesSynergy ?? []) {
      push(m.muscleId, m.Muscle.groupId, "synergy");
    }
    for (const m of action.MusclesStabilizer ?? []) {
      push(m.muscleId, m.Muscle.groupId, "stabilizer");
    }
  }

  // Replace stats in a transaction if tx not provided
  const runner = async (client: PrismaTransactionClient) => {
    await client.trainingMuscleStat.deleteMany({ where: { trainingId } });
    if (acc.size === 0) return;
    await client.trainingMuscleStat.createMany({
      data: Array.from(acc.values()).map((i) => ({
        trainingId,
        muscleId: i.muscleId,
        muscleGroupId: i.muscleGroupId,
        asAgonyCnt: i.asAgonyCnt,
        asSynerCnt: i.asSynerCnt,
        asStableCnt: i.asStableCnt,
      })),
    });
  };

  if (tx) {
    await runner(tx);
  } else {
    await prisma.$transaction(async (trx) => {
      // cast to PrismaTransactionClient compatible type
      // @ts-ignore
      await runner(trx);
    });
  }
}
