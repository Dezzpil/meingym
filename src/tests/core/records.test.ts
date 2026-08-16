import { assert } from "chai";
import { test } from "node:test";
import { PersonalRecordType } from "@prisma/client";
import type { Purpose } from "@prisma/client";
import {
  buildRecordCandidates,
  evaluateRecord,
  filterRecordableExecutions,
  valuateMaxWeight,
  valuateVolume,
} from "@/core/records";
import type {
  LastRecordRef,
  RecordCandidate,
  RecordableExecution,
} from "@/core/records";

function execution(
  weight: number,
  count: number,
  overrides: Partial<RecordableExecution> = {},
): RecordableExecution {
  return {
    liftedWeight: weight,
    liftedCount: count,
    isPassed: false,
    approachId: null,
    ...overrides,
  };
}

function makeCandidate(
  overrides: Partial<RecordCandidate> = {},
): RecordCandidate {
  return {
    userId: "user-1",
    actionId: 1,
    purpose: "MASS" as Purpose,
    type: PersonalRecordType.MAX_WEIGHT,
    value: 100,
    reps: 5,
    trainingId: 10,
    trainingExerciseId: 100,
    periodId: 1,
    achievedAt: new Date("2026-08-01T10:00:00Z"),
    ...overrides,
  };
}

function ref(value: number, achievedAt: string): LastRecordRef {
  return { value, trainingId: 1, achievedAt: new Date(achievedAt) };
}

test("Расчёт значений рекордов из выполнений упражнения", async (t) => {
  await t.test("максимальный вес: при равенстве веса берём больше повторов", () => {
    const executions = [
      execution(100, 5),
      execution(102.5, 3),
      execution(102.5, 4),
      execution(90, 10),
    ];
    assert.deepEqual(valuateMaxWeight(executions), { value: 102.5, reps: 4 });
  });

  await t.test("пустой список — null", () => {
    assert.isNull(valuateMaxWeight([]));
    assert.isNull(valuateVolume([]));
  });

  await t.test("тоннаж: сумма вес × повторы с округлением до сотых", () => {
    assert.equal(
      valuateVolume([execution(102.5, 3), execution(100, 5)]),
      807.5,
    );
  });

  await t.test(
    "пропущенные, нулевые и boost-подходы не учитываются",
    () => {
      const executions = [
        execution(100, 5),
        execution(200, 1, { isPassed: true }),
        execution(150, 2, { liftedCount: 0 }),
        execution(150, 2, { liftedWeight: 0 }),
        execution(300, 1, { approachId: 7 }),
      ];
      const approaches = [
        { id: 7, isBoost: true },
        { id: 8, isBoost: false },
      ];
      const valued = filterRecordableExecutions(executions, approaches);
      assert.equal(valued.length, 1);
      assert.equal(valuateMaxWeight(valued)!.value, 100);
    },
  );
});

test("Кандидаты на рекорды из упражнения тренировки", async (t) => {
  await t.test("оба типа с корректными значениями", () => {
    const candidates = buildRecordCandidates({
      userId: "user-1",
      trainingId: 10,
      trainingExerciseId: 100,
      actionId: 1,
      purpose: "MASS" as Purpose,
      periodId: 2,
      achievedAt: new Date("2026-08-01T10:00:00Z"),
      executions: [execution(100, 5), execution(95, 8)],
      approaches: [],
    });
    assert.equal(candidates.length, 2);

    const maxWeight = candidates.find(
      (c) => c.type === PersonalRecordType.MAX_WEIGHT,
    )!;
    assert.equal(maxWeight.value, 100);
    assert.equal(maxWeight.reps, 5);

    const volume = candidates.find(
      (c) => c.type === PersonalRecordType.MAX_VOLUME,
    )!;
    assert.equal(volume.value, 1260);
    assert.isNull(volume.reps);
  });

  await t.test("нет учётных подходов — кандидатов нет", () => {
    const candidates = buildRecordCandidates({
      userId: "user-1",
      trainingId: 10,
      trainingExerciseId: 100,
      actionId: 1,
      purpose: "MASS" as Purpose,
      periodId: null,
      achievedAt: new Date("2026-08-01T10:00:00Z"),
      executions: [execution(100, 5, { isPassed: true })],
      approaches: [],
    });
    assert.equal(candidates.length, 0);
  });
});

test("Логика оценки рекорда", async (t) => {
  await t.test("первый результат — тихая база all-time", () => {
    const entry = evaluateRecord(makeCandidate(), null, null);
    assert.isNotNull(entry);
    assert.isTrue(entry!.isAllTime);
    assert.isNull(entry!.previousValue);
    assert.isNull(entry!.previousTrainingId);
    assert.isNull(entry!.previousAt);
  });

  await t.test("строго больше all-time — абсолютный рекорд с прежним лучшим", () => {
    const entry = evaluateRecord(
      makeCandidate({ value: 102.5 }),
      ref(100, "2026-07-01T10:00:00Z"),
      ref(95, "2026-07-20T10:00:00Z"),
    );
    assert.isTrue(entry!.isAllTime);
    assert.equal(entry!.previousValue, 100);
    assert.equal(entry!.previousTrainingId, 1);
  });

  await t.test("равенство — не рекорд", () => {
    assert.isNull(
      evaluateRecord(
        makeCandidate({ value: 100 }),
        ref(100, "2026-07-01T10:00:00Z"),
        ref(100, "2026-07-20T10:00:00Z"),
      ),
    );
  });

  await t.test("равен all-time, но превышает период — рекорд периода", () => {
    const entry = evaluateRecord(
      makeCandidate({ value: 100 }),
      ref(100, "2026-07-01T10:00:00Z"),
      ref(90, "2026-07-20T10:00:00Z"),
    );
    assert.isNotNull(entry);
    assert.isFalse(entry!.isAllTime);
    assert.equal(entry!.previousValue, 90);
  });

  await t.test("меньше all-time и тренировка без периода — записи нет", () => {
    assert.isNull(
      evaluateRecord(
        makeCandidate({ value: 95, periodId: null }),
        ref(100, "2026-07-01T10:00:00Z"),
        null,
      ),
    );
  });

  await t.test("меньше all-time, новый период — тихая база периода", () => {
    const entry = evaluateRecord(
      makeCandidate({ value: 95 }),
      ref(100, "2026-07-01T10:00:00Z"),
      null,
    );
    assert.isNotNull(entry);
    assert.isFalse(entry!.isAllTime);
    assert.isNull(entry!.previousValue);
  });

  await t.test("рост внутри периода без all-time — рекорд периода", () => {
    const entry = evaluateRecord(
      makeCandidate({ value: 97.5 }),
      ref(100, "2026-07-01T10:00:00Z"),
      ref(95, "2026-07-20T10:00:00Z"),
    );
    assert.isFalse(entry!.isAllTime);
    assert.equal(entry!.previousValue, 95);
    assert.equal(entry!.previousTrainingId, 1);
  });

  await t.test("не больше последней записи периода — записи нет", () => {
    assert.isNull(
      evaluateRecord(
        makeCandidate({ value: 94 }),
        ref(100, "2026-07-01T10:00:00Z"),
        ref(95, "2026-07-20T10:00:00Z"),
      ),
    );
  });
});

test("Цепочка рекордов по ходу истории (как в пересчёте)", async (t) => {
  // то же ведение состояния «последний рекорд связки», что в recalculate
  const state = new Map<string, LastRecordRef>();
  const apply = (candidate: RecordCandidate) => {
    const aKey = `${candidate.actionId}:${candidate.purpose}:${candidate.type}`;
    const pKey =
      candidate.periodId !== null ? `${aKey}#${candidate.periodId}` : null;
    const entry = evaluateRecord(
      candidate,
      state.get(aKey) ?? null,
      pKey ? (state.get(pKey) ?? null) : null,
    );
    if (entry) {
      const r: LastRecordRef = {
        value: entry.value,
        trainingId: entry.trainingId,
        achievedAt: entry.achievedAt,
      };
      if (entry.isAllTime) state.set(aKey, r);
      if (pKey) state.set(pKey, r);
    }
    return entry;
  };

  await t.test("база → абсолютный → новый период → периодический", () => {
    // первая тренировка в истории — тихая база
    let entry = apply(
      makeCandidate({
        value: 80,
        trainingId: 1,
        achievedAt: new Date("2026-06-01T10:00:00Z"),
      }),
    );
    assert.isTrue(entry!.isAllTime);
    assert.isNull(entry!.previousValue);

    // превысили абсолютный
    entry = apply(
      makeCandidate({
        value: 85,
        trainingId: 2,
        achievedAt: new Date("2026-06-15T10:00:00Z"),
      }),
    );
    assert.isTrue(entry!.isAllTime);
    assert.equal(entry!.previousValue, 80);

    // новый период, результат ниже абсолютного — база периода
    entry = apply(
      makeCandidate({
        value: 82.5,
        periodId: 2,
        trainingId: 3,
        achievedAt: new Date("2026-07-01T10:00:00Z"),
      }),
    );
    assert.isFalse(entry!.isAllTime);
    assert.isNull(entry!.previousValue);

    // рост внутри периода без абсолютного рекорда
    entry = apply(
      makeCandidate({
        value: 84,
        periodId: 2,
        trainingId: 4,
        achievedAt: new Date("2026-07-10T10:00:00Z"),
      }),
    );
    assert.isFalse(entry!.isAllTime);
    assert.equal(entry!.previousValue, 82.5);

    // абсолютный внутри периода: сравнивается с all-time 85, а не с записью периода
    entry = apply(
      makeCandidate({
        value: 86,
        periodId: 2,
        trainingId: 5,
        achievedAt: new Date("2026-07-20T10:00:00Z"),
      }),
    );
    assert.isTrue(entry!.isAllTime);
    assert.equal(entry!.previousValue, 85);

    // равенство последней записи периода — не рекорд
    entry = apply(
      makeCandidate({
        value: 86,
        periodId: 2,
        trainingId: 6,
        achievedAt: new Date("2026-07-22T10:00:00Z"),
      }),
    );
    assert.isNull(entry);

    // следующий абсолютный сравнивается с 86 — all-time обновился и в периоде
    entry = apply(
      makeCandidate({
        value: 87,
        periodId: 2,
        trainingId: 7,
        achievedAt: new Date("2026-07-25T10:00:00Z"),
      }),
    );
    assert.isTrue(entry!.isAllTime);
    assert.equal(entry!.previousValue, 86);
  });
});
