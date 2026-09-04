import { prisma } from "@/tools/db";
import type { PersonalRecord, PersonalRecordType, Purpose } from "@prisma/client";

const PAGE_SIZE = 50;

// --- DTO Types ---

export type MobileRecordDTO = {
  id: number;
  /** ID упражнения из справочника `GET /api/mobile/v1/exercises` */
  actionId: number;
  purpose: Purpose;
  /** MAX_WEIGHT — максимальный вес подхода, MAX_VOLUME — тоннаж (для duration — Σ секунд) */
  type: PersonalRecordType;
  /** абсолютный рекорд за всё время или лучший результат периода */
  isAllTime: boolean;
  /** кг; для duration-упражнений — секунды */
  value: number;
  /** повторы рекордного подхода — только для MAX_WEIGHT */
  reps: number | null;
  /** период периодического рекорда; null для all-time записей тренировок без периода */
  periodId: number | null;
  trainingId: number;
  trainingExerciseId: number;
  /** = Training.completedAt; устойчива к пересчёту рекордов, в отличие от id и createdAt */
  achievedAt: string;
  /** прежний лучший результат той же связки; null — «база» (первый результат в истории или периоде) */
  previousValue: number | null;
  previousTrainingId: number | null;
  previousAt: string | null;
  createdAt: string;
};

export type MobileRecordsResponse = {
  meta: {
    total: number;
    nextCursor: number | null;
  };
  items: MobileRecordDTO[];
};

// --- Helpers ---

function mapRecord(record: PersonalRecord): MobileRecordDTO {
  return {
    id: record.id,
    actionId: record.actionId,
    purpose: record.purpose,
    type: record.type,
    isAllTime: record.isAllTime,
    value: record.value,
    reps: record.reps,
    periodId: record.periodId,
    trainingId: record.trainingId,
    trainingExerciseId: record.trainingExerciseId,
    achievedAt: record.achievedAt.toISOString(),
    previousValue: record.previousValue,
    previousTrainingId: record.previousTrainingId,
    previousAt: record.previousAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

// --- Main function ---

/**
 * Список персональных рекордов пользователя: все записи (all-time и периодические,
 * включая «базу» с previousValue = null) — фильтрацию клиент делает сам.
 * Отдаются рекорды, достигнутые не раньше `since` (`achievedAt`), страницами по id.
 */
export async function getRecordsList(
  userId: string,
  since: Date,
  cursor?: number,
): Promise<MobileRecordsResponse> {
  const where = {
    userId,
    achievedAt: { gte: since },
    ...(cursor ? { id: { gt: cursor } } : {}),
  };

  const [records, total] = await Promise.all([
    prisma.personalRecord.findMany({
      where,
      take: PAGE_SIZE + 1,
      orderBy: { id: "asc" },
    }),
    prisma.personalRecord.count({
      where: { userId, achievedAt: { gte: since } },
    }),
  ]);

  const hasMore = records.length > PAGE_SIZE;
  const items = hasMore ? records.slice(0, PAGE_SIZE) : records;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { meta: { total, nextCursor }, items: items.map(mapRecord) };
}
