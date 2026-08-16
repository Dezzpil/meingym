import { prisma } from "@/tools/db";
import type { PersonalRecordType, Purpose } from "@prisma/client";
import { evaluateRecord } from "./evaluate";
import { buildRecordCandidates } from "./engine";
import type { LastRecordRef, NewPersonalRecordEntry } from "./types";

const INSERT_BATCH_SIZE = 500;

function allTimeKey(
  actionId: number,
  purpose: Purpose,
  type: PersonalRecordType,
): string {
  return `${actionId}:${purpose}:${type}`;
}

function periodKeyFor(
  actionId: number,
  purpose: Purpose,
  type: PersonalRecordType,
  periodId: number,
): string {
  return `${actionId}:${purpose}:${type}#${periodId}`;
}

/**
 * Полностью пересчитывает персональные рекорды пользователя по всей истории
 * завершённых тренировок (от ранних к поздним). Идемпотентно: удаляет
 * существующие записи и создаёт заново. Прежние рекорды берутся из создаваемых
 * по ходу обхода записей PersonalRecord — той же механикой, что и детект на лету.
 */
export async function recalculatePersonalRecordsForUser(
  userId: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await tx.personalRecord.deleteMany({ where: { userId } });

    const trainings = await tx.training.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: [{ completedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        completedAt: true,
        periodId: true,
        TrainingExercise: {
          orderBy: { priority: "asc" },
          select: {
            id: true,
            actionId: true,
            purpose: true,
            TrainingExerciseExecution: {
              orderBy: { priority: "asc" },
              select: {
                liftedWeight: true,
                liftedCount: true,
                isPassed: true,
                approachId: true,
              },
            },
            ApproachGroup: {
              select: {
                Approaches: { select: { id: true, isBoost: true } },
              },
            },
          },
        },
      },
    });

    // состояние «последний рекорд связки» — это созданные по ходу записи PersonalRecord
    const lastRecords = new Map<string, LastRecordRef>();
    const entries: NewPersonalRecordEntry[] = [];

    for (const training of trainings) {
      const achievedAt = training.completedAt as Date;
      for (const exercise of training.TrainingExercise) {
        const candidates = buildRecordCandidates({
          userId,
          trainingId: training.id,
          trainingExerciseId: exercise.id,
          actionId: exercise.actionId,
          purpose: exercise.purpose,
          periodId: training.periodId,
          achievedAt,
          executions: exercise.TrainingExerciseExecution,
          approaches: exercise.ApproachGroup.Approaches,
        });

        for (const candidate of candidates) {
          const aKey = allTimeKey(
            candidate.actionId,
            candidate.purpose,
            candidate.type,
          );
          const lastAllTime = lastRecords.get(aKey) ?? null;

          const lastInPeriod =
            candidate.periodId !== null
              ? (lastRecords.get(
                  periodKeyFor(
                    candidate.actionId,
                    candidate.purpose,
                    candidate.type,
                    candidate.periodId,
                  ),
                ) ?? null)
              : null;

          const entry = evaluateRecord(candidate, lastAllTime, lastInPeriod);
          if (!entry) continue;

          entries.push(entry);
          const ref: LastRecordRef = {
            value: entry.value,
            trainingId: entry.trainingId,
            achievedAt: entry.achievedAt,
          };
          if (entry.isAllTime) {
            lastRecords.set(aKey, ref);
          }
          if (entry.periodId !== null) {
            lastRecords.set(
              periodKeyFor(
                entry.actionId,
                entry.purpose,
                entry.type,
                entry.periodId,
              ),
              ref,
            );
          }
        }
      }
    }

    for (let i = 0; i < entries.length; i += INSERT_BATCH_SIZE) {
      await tx.personalRecord.createMany({
        data: entries.slice(i, i + INSERT_BATCH_SIZE),
      });
    }
    return entries.length;
  });
}
