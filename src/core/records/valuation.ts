const MAX_WEIGHT_MAX_COUNT_FOR_RECORD = 3;

// Минимальный интерфейс выполнения, необходимый для расчёта рекордов
export type RecordableExecution = {
  liftedWeight: number;
  liftedCount: number;
  isPassed: boolean;
  approachId: number | null;
};

// Учётные подходы: не пропущенные, с реальной нагрузкой, не boost-подходы (как в прогрессии)
export function filterRecordableExecutions(
  executions: RecordableExecution[],
  approaches: { id: number; isBoost: boolean }[],
): RecordableExecution[] {
  const boostIds = new Set(
    approaches.filter((a) => a.isBoost).map((a) => a.id),
  );
  return executions.filter(
    (e) =>
      !e.isPassed &&
      e.liftedCount > 0 &&
      e.liftedWeight > 0 &&
      !(e.approachId !== null && boostIds.has(e.approachId)),
  );
}

// Максимальный вес одного подхода; при равенстве веса — подход с большим числом повторов.
// Учитываются только подходы с числом повторов ≤ MAX_WEIGHT_MAX_COUNT_FOR_RECORD:
// высокоповторные подходы — это работа на объём, а не на абсолютный максимум.
export function valuateMaxWeight(
  executions: RecordableExecution[],
): { value: number; reps: number } | null {
  const eligible = executions.filter(
    (e) => e.liftedCount <= MAX_WEIGHT_MAX_COUNT_FOR_RECORD,
  );
  if (!eligible.length) return null;
  let best = eligible[0];
  for (const e of eligible.slice(1)) {
    if (
      e.liftedWeight > best.liftedWeight ||
      (e.liftedWeight === best.liftedWeight && e.liftedCount > best.liftedCount)
    ) {
      best = e;
    }
  }
  return { value: best.liftedWeight, reps: best.liftedCount };
}

// Тоннаж упражнения: сумма вес × повторы по всем учётным подходам
export function valuateVolume(
  executions: RecordableExecution[],
): number | null {
  if (!executions.length) return null;
  const sum = executions.reduce(
    (acc, e) => acc + e.liftedWeight * e.liftedCount,
    0,
  );
  // округляем до сотых, чтобы не таскать погрешность float в БД и сравнения
  return Math.round(sum * 100) / 100;
}

// Учётные подходы для упражнений «на длительность»: не пропущенные, с секундами > 0,
// не boost. Параметр (liftedWeight) может быть 0, поэтому требование liftedWeight > 0
// здесь не применяется.
export function filterDurationRecordableExecutions(
  executions: RecordableExecution[],
  approaches: { id: number; isBoost: boolean }[],
): RecordableExecution[] {
  const boostIds = new Set(
    approaches.filter((a) => a.isBoost).map((a) => a.id),
  );
  return executions.filter(
    (e) =>
      !e.isPassed &&
      e.liftedCount > 0 &&
      !(e.approachId !== null && boostIds.has(e.approachId)),
  );
}

// Объём для упражнений «на длительность» = суммарное время (Σ секунд), а не тоннаж.
export function valuateDurationVolume(
  executions: RecordableExecution[],
): number | null {
  if (!executions.length) return null;
  return executions.reduce((acc, e) => acc + e.liftedCount, 0);
}
