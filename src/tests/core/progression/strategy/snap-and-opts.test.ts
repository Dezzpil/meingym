import { SetData, SetDataExecuted } from "@/core/types";
import { assert } from "chai";
import { test } from "node:test";
import {
  ProgressionStrategySimple,
  ProgressionStrategySimpleOptsDefaults,
  ProgressionStrategySimpleOptsType,
} from "@/core/progression/strategy/simple";

const makeExecuted = (arr: Array<[number, number]>): SetDataExecuted[] =>
  arr.map(
    ([w, c]) =>
      ({
        weight: w,
        count: c,
        rating: "",
        cheating: "",
        refusing: "",
        burning: "",
      }) as SetDataExecuted,
  );

const baseAction = {
  rig: "BARBELL" as const,
  bigCount: false,
  oneDumbbell: false,
  isDurationBased: false,
  durationParamLabel: null,
};

const baseOpts: ProgressionStrategySimpleOptsType = {
  ...ProgressionStrategySimpleOptsDefaults,
};

test("_snapWeight: округление до шага оборудования", async (t) => {
  await t.test("step 2.5: 7.125 → 7.5", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 2.5,
    });
    assert.equal(strategy._snapWeight(7.125), 7.5);
  });

  await t.test("step 2.5: 7.1 → 7.5", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 2.5,
    });
    assert.equal(strategy._snapWeight(7.1), 7.5);
  });

  await t.test("step 2.5: 7.0 → 7.5", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 2.5,
    });
    assert.equal(strategy._snapWeight(7.0), 7.5);
  });

  await t.test("step 1.25: точные значения не меняются", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 1.25,
    });
    assert.equal(strategy._snapWeight(7.5), 7.5);
    assert.equal(strategy._snapWeight(10), 10);
    assert.equal(strategy._snapWeight(1.25), 1.25);
  });

  await t.test("step 5: округление до кратных 5", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 5,
    });
    assert.equal(strategy._snapWeight(7), 5);
    assert.equal(strategy._snapWeight(8), 10);
    assert.equal(strategy._snapWeight(12), 10);
    assert.equal(strategy._snapWeight(13), 15);
  });
});

test("конструктор не мутирует объект дефолтов", async (t) => {
  await t.test("два инстанса с разными opts независимы", () => {
    const defaultsBefore = { ...ProgressionStrategySimpleOptsDefaults };

    const strategy1 = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 1.25,
      strengthRepThreshold: 5,
    });
    const strategy2 = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 5,
      strengthRepThreshold: 1,
    });

    assert.equal(strategy1._opts.equipmentStep, 1.25);
    assert.equal(strategy2._opts.equipmentStep, 5);
    assert.equal(strategy1._opts.strengthRepThreshold, 5);
    assert.equal(strategy2._opts.strengthRepThreshold, 1);

    assert.deepEqual(ProgressionStrategySimpleOptsDefaults, defaultsBefore);
  });
});

test("mass: безопасная работа с transitions при massSetsCount > 5", async (t) => {
  await t.test("не падает при 6 подходах (transitions.length === 5)", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      massSetsCount: 6,
      massAddDropSet: false,
    });
    const executed = makeExecuted([
      [30, 10],
      [32.5, 10],
      [35, 10],
      [37.5, 10],
      [40, 10],
      [42.5, 10],
    ]);
    const next = strategy.mass([], executed);
    assert.lengthOf(next, 6);
    next.forEach((s) => {
      assert.isAbove(s.count, 0);
      assert.isAbove(s.weight, 0);
    });
  });
});

test("strength: strengthRepThreshold настраивается", async (t) => {
  await t.test("порог 5: не перестраивает лестницу при 3 повторах", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      strengthRepThreshold: 5,
      strengthWorkingSetsCount: 4,
      strengthPrepareSetsCount: 0,
      strengthWeightDelta: 5,
    });
    const executed = makeExecuted([
      [75, 3],
      [80, 3],
      [85, 3],
      [90, 3],
    ]);
    const next = strategy._upgradeStrengthWorkingSets(executed);
    // при пороге 5, 3 повтора НЕ триггерят rebuild — лестница выравнивается
    // порядок: от лёгкого к тяжёлому (push в else-ветке)
    // increaseNext стартует true, первый подход снизу получает +1
    assert.equal(next[0].weight, 75);
    assert.equal(next[0].count, 4); // лёгкий подход получил +1
    assert.equal(next[3].weight, 90);
    assert.equal(next[3].count, 3); // тяжёлый подход без изменений
  });

  await t.test("порог 3: перестраивает лестницу при 3 повторах", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      strengthRepThreshold: 3,
      strengthWorkingSetsCount: 4,
      strengthPrepareSetsCount: 0,
      strengthWeightDelta: 5,
    });
    const executed = makeExecuted([
      [75, 3],
      [80, 3],
      [85, 3],
      [90, 3],
    ]);
    const next = strategy._upgradeStrengthWorkingSets(executed);
    // при пороге 3, лучший подход (90x3) триггерит rebuild
    // порядок: от лёгкого к тяжёлому (unshift при rebuild)
    assert.equal(next[3].weight, 95); // 90 + 5
    assert.equal(next[3].count, 1);
  });
});

test("loss: resetMultiplier настраивается", async (t) => {
  await t.test("множитель 3: откат на 3 шага при достижении потолка", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      lossCountMax: 16,
      lossCountStep: 2,
      resetMultiplier: 3,
    });
    const planned: SetData[] = [
      { weight: 10, count: 16 },
      { weight: 10, count: 16 },
    ];
    const executed = makeExecuted([
      [10, 16],
      [10, 16],
    ]);
    const next = strategy.loss(planned, executed);
    // mean >= lossCountMax → mean = 16 - 3*2 = 10
    assert.equal(next[0].count, 10);
  });
});

test("снаппинг весов на выходе из mass", async (t) => {
  await t.test("все выходные веса кратны equipmentStep", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 2.5,
      massWeightDelta: 1.25,
    });
    const executed = makeExecuted([
      [30, 16],
      [30, 14],
      [30, 12],
      [30, 10],
    ]);
    const next = strategy.mass([], executed);
    next.forEach((s) => {
      assert.equal(
        s.weight % 2.5,
        0,
        `weight ${s.weight} не кратен шагу 2.5`,
      );
    });
  });
});

test("снаппинг весов на выходе из loss", async (t) => {
  await t.test("все выходные веса кратны equipmentStep", () => {
    const strategy = new ProgressionStrategySimple(baseAction, {
      ...baseOpts,
      equipmentStep: 2.5,
      lossWeightDelta: 1.25,
      lossMaxSets: 3,
    });
    // Загоняем в ветку lossMaxSets, где вес увеличивается
    const planned: SetData[] = [
      { weight: 10, count: 16 },
      { weight: 10, count: 16 },
      { weight: 10, count: 16 },
      { weight: 10, count: 16 },
    ];
    const executed = makeExecuted([
      [10, 16],
      [10, 16],
      [10, 16],
      [10, 16],
    ]);
    const next = strategy.loss(planned, executed);
    next.forEach((s) => {
      assert.equal(
        s.weight % 2.5,
        0,
        `weight ${s.weight} не кратен шагу 2.5`,
      );
    });
  });
});
