import type { Action } from "@prisma/client";
import { SetData, SetDataExecuted } from "@/core/types";
import { assert } from "chai";
import { test } from "node:test";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";

// Полный набор опций. Не используем изменяемый ProgressionStrategySimpleOptsDefaults
// напрямую: конструктор делает Object.assign(defaults, opts) и мутирует общий объект,
// поэтому каждый тест собираем opts из локальной константы для детерминизма.
const BASE_OPTS = {
  strengthWorkingSetsCount: 4,
  strengthPrepareSetsCount: 2,
  strengthWeightDelta: 5,
  massSetsCount: 4,
  massAddDropSet: false,
  massBigCountCoef: 1.8,
  massWeightDelta: 2.5,
  lossCountStep: 2,
  lossCountMax: 16,
  lossWeightDelta: 1.25,
  lossMaxSets: 6,
  durationSetsCount: 3,
  durationStepSec: 10,
  durationMaxSec: 120,
  durationParamStep: 1,
  durationMaxSets: 5,
};

type DurationActionPick = Pick<
  Action,
  "rig" | "bigCount" | "oneDumbbell" | "isDurationBased" | "durationParamLabel"
>;

// с параметром сложности (наклон) — durationParamLabel != null
const WITH_PARAM: DurationActionPick = {
  rig: "OTHER",
  bigCount: false,
  oneDumbbell: false,
  isDurationBased: true,
  durationParamLabel: "Наклон",
};

// без параметра сложности — durationParamLabel == null
const NO_PARAM: DurationActionPick = {
  rig: "OTHER",
  bigCount: false,
  oneDumbbell: false,
  isDurationBased: true,
  durationParamLabel: null,
};

function makeStrategy(
  action: DurationActionPick,
  optsOverrides: Partial<typeof BASE_OPTS> = {},
): ProgressionStrategySimple {
  return new ProgressionStrategySimple(action, {
    ...BASE_OPTS,
    ...optsOverrides,
  });
}

// duration() читает только count (секунды) и weight (параметр)
const exec = (param: number, sec: number): SetDataExecuted =>
  ({ weight: param, count: sec } as unknown as SetDataExecuted);

test("duration: с параметром сложности", async (context) => {
  await context.test(
    "растит среднее время на шаг, параметр не меняется",
    function () {
      const strategy = makeStrategy(WITH_PARAM);
      const planned: SetData[] = [];
      const upgraded = strategy.duration(planned, [exec(5, 30)]);
      assert.lengthOf(upgraded, 3); // durationSetsCount
      assert.equal(upgraded[0].count, 40); // 30 + durationStepSec(10)
      assert.equal(upgraded[0].weight, 5); // параметр без изменений
      assert.equal(upgraded[1].count, 40);
      assert.equal(upgraded[2].count, 40);
    },
  );

  await context.test("уважает число запланированных подходов", function () {
    const strategy = makeStrategy(WITH_PARAM);
    const planned: SetData[] = [
      { weight: 5, count: 30 },
      { weight: 5, count: 30 },
    ];
    const upgraded = strategy.duration(planned, [exec(5, 30)]);
    assert.lengthOf(upgraded, 2);
    assert.equal(upgraded[0].count, 40);
  });

  await context.test(
    "по достижении потолка сбрасывает время и повышает параметр",
    function () {
      const strategy = makeStrategy(WITH_PARAM);
      const planned: SetData[] = [];
      // sec(120) >= durationMaxSec(120)
      const upgraded = strategy.duration(planned, [exec(5, 120)]);
      assert.lengthOf(upgraded, 3);
      // сброс: durationMaxSec - 2*durationStepSec = 120 - 20 = 100
      assert.equal(upgraded[0].count, 100);
      // параметр вырос на durationParamStep(1)
      assert.equal(upgraded[0].weight, 6);
    },
  );

  await context.test(
    "последовательная прогрессия: время растёт до потолка, затем +параметр и сброс",
    function () {
      const strategy = makeStrategy(WITH_PARAM);
      const planned: SetData[] = [];
      let out = strategy.duration(planned, [exec(5, 30)]);
      assert.equal(out[0].count, 40);
      assert.equal(out[0].weight, 5);

      let guard = 0;
      // крутим, пока параметр не вырастет (значит, упёрлись в потолок времени)
      while (out[0].weight === 5 && guard < 50) {
        out = strategy.duration(planned, out as unknown as SetDataExecuted[]);
        guard++;
      }
      assert.equal(out[0].weight, 6); // параметр повысился
      assert.equal(out[0].count, 100); // время сброшено
      assert.isBelow(guard, 50);
    },
  );
});

test("duration: без параметра сложности", async (context) => {
  await context.test("растит только секунды", function () {
    const strategy = makeStrategy(NO_PARAM);
    const upgraded = strategy.duration([], [exec(0, 30)]);
    assert.lengthOf(upgraded, 3);
    assert.equal(upgraded[0].count, 40);
    assert.equal(upgraded[0].weight, 0);
  });

  await context.test("по достижении потолка добавляет подход", function () {
    const strategy = makeStrategy(NO_PARAM);
    // sec(120) >= durationMaxSec(120), параметра нет → addSet
    const upgraded = strategy.duration([], [exec(0, 120)]);
    assert.lengthOf(upgraded, 4); // 3 базовых + 1 добавленный
    assert.equal(upgraded[0].count, 100);
    assert.equal(upgraded[3].count, 100);
    assert.equal(upgraded[0].weight, 0);
  });

  await context.test("не превышает durationMaxSets", function () {
    const strategy = makeStrategy(NO_PARAM, { durationMaxSets: 3 });
    const planned: SetData[] = [
      { weight: 0, count: 120 },
      { weight: 0, count: 120 },
      { weight: 0, count: 120 },
    ];
    const upgraded = strategy.duration(planned, [exec(0, 120)]);
    // setsCount = planned.length = 3; addSet, но 3 < durationMaxSets(3) === false
    assert.lengthOf(upgraded, 3);
    assert.equal(upgraded[0].count, 100);
  });
});
