import type {
  LastRecordRef,
  RecordCandidate,
  NewPersonalRecordEntry,
} from "./types";

// Сравнение с точностью до сотых: защита от погрешности float в тоннаже
function isStrictlyGreater(value: number, previous: number): boolean {
  return Math.round(value * 100) > Math.round(previous * 100);
}

function toEntry(
  candidate: RecordCandidate,
  isAllTime: boolean,
  previous: LastRecordRef | null,
): NewPersonalRecordEntry {
  return {
    ...candidate,
    isAllTime,
    previousValue: previous?.value ?? null,
    previousTrainingId: previous?.trainingId ?? null,
    previousAt: previous?.achievedAt ?? null,
  };
}

/**
 * Решает, фиксировать ли новый рекорд по результату упражнения.
 *
 * - прежнего all-time рекорда нет → «база» (isAllTime = true, без previous*) — на UI не показывается;
 * - значение строго больше all-time рекорда → абсолютный рекорд (isAllTime = true),
 *   он же лучший результат текущего периода;
 * - иначе при указанном периоде: записей в периоде нет → «база» периода (тихо),
 *   значение строго больше последней записи периода → рекорд периода (isAllTime = false);
 * - равенство или отсутствие периода → записи нет.
 */
export function evaluateRecord(
  candidate: RecordCandidate,
  lastAllTime: LastRecordRef | null,
  lastInPeriod: LastRecordRef | null,
): NewPersonalRecordEntry | null {
  if (!lastAllTime) {
    return toEntry(candidate, true, null);
  }
  if (isStrictlyGreater(candidate.value, lastAllTime.value)) {
    return toEntry(candidate, true, lastAllTime);
  }
  if (candidate.periodId === null) {
    return null;
  }
  if (!lastInPeriod) {
    return toEntry(candidate, false, null);
  }
  if (isStrictlyGreater(candidate.value, lastInPeriod.value)) {
    return toEntry(candidate, false, lastInPeriod);
  }
  return null;
}
