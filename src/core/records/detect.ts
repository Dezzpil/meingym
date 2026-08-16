import { prisma } from "@/tools/db";
import { evaluateRecord } from "./evaluate";
import { buildRecordCandidates } from "./engine";
import type { LastRecordRef, NewPersonalRecordEntry } from "./types";

/**
 * Фиксирует персональные рекорды по завершённой тренировке.
 * Прежние рекорды ищутся только среди записей PersonalRecord пользователя
 * по связке упражнение + цель + тип (для периода — среди записей того же периода).
 *
 * Идемпотентно: записи этой тренировки пересоздаются, поэтому безопасно
 * при ретраях обработки (processedAt ещё не установлен).
 */
export async function detectPersonalRecordsForTraining(
  trainingId: number,
  userId: string,
): Promise<number> {
  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    select: {
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
  if (!training.completedAt) {
    throw new Error(`Тренировка ${trainingId} еще не завершена`);
  }

  return prisma.$transaction(async (tx) => {
    // удаляем записи этой тренировки до поиска previous — иначе найдём саму тренировку
    await tx.personalRecord.deleteMany({ where: { trainingId } });

    const entries: NewPersonalRecordEntry[] = [];
    for (const exercise of training.TrainingExercise) {
      const candidates = buildRecordCandidates({
        userId,
        trainingId,
        trainingExerciseId: exercise.id,
        actionId: exercise.actionId,
        purpose: exercise.purpose,
        periodId: training.periodId,
        achievedAt: training.completedAt as Date,
        executions: exercise.TrainingExerciseExecution,
        approaches: exercise.ApproachGroup.Approaches,
      });

      for (const candidate of candidates) {
        const lastAllTime = await tx.personalRecord.findFirst({
          where: {
            userId,
            actionId: candidate.actionId,
            purpose: candidate.purpose,
            type: candidate.type,
            isAllTime: true,
            achievedAt: { lt: training.completedAt as Date },
          },
          orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
          select: { value: true, trainingId: true, achievedAt: true },
        });

        let lastInPeriod: LastRecordRef | null = null;
        if (training.periodId !== null) {
          lastInPeriod = await tx.personalRecord.findFirst({
            where: {
              userId,
              actionId: candidate.actionId,
              purpose: candidate.purpose,
              type: candidate.type,
              periodId: training.periodId,
              achievedAt: { lt: training.completedAt as Date },
            },
            orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
            select: { value: true, trainingId: true, achievedAt: true },
          });
        }

        const entry = evaluateRecord(candidate, lastAllTime, lastInPeriod);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    if (entries.length) {
      await tx.personalRecord.createMany({ data: entries });
    }
    return entries.length;
  });
}
