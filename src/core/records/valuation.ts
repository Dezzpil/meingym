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

// Максимальный вес одного подхода; при равенстве веса — подход с большим числом повторов
export function valuateMaxWeight(
  executions: RecordableExecution[],
): { value: number; reps: number } | null {
  if (!executions.length) return null;
  let best = executions[0];
  for (const e of executions) {
    if (e.liftedCount > MAX_WEIGHT_MAX_COUNT_FOR_RECORD) {
      console.log(
        `skip execution for max weight because > ${MAX_WEIGHT_MAX_COUNT_FOR_RECORD}: ${e.liftedCount}`,
      );
      continue;
    }
    if (
      e.liftedWeight > best.liftedWeight ||
      (e.liftedWeight === best.liftedWeight && e.liftedCount > best.liftedCount)
    ) {
      best = e;
    }
  }
  if (best.liftedCount > MAX_WEIGHT_MAX_COUNT_FOR_RECORD) return null;
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
