import { SetData, SetDataExecuted } from "@/core/types";
import { assert } from "chai";
import { test } from "node:test";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";

const makeExecuted = (arr: Array<[number, number]>): SetDataExecuted[] =>
  arr.map(([w, c]) => ({ weight: w, count: c, rating: "", cheating: "", refusing: "", burning: "" }));

const actionOneDb = {
  rig: "DUMBBELL" as any,
  strengthAllowed: true,
  bigCount: false,
  oneDumbbell: true,
};

const opts = {
  strengthWorkingSetsCount: 4,
  strengthPrepareSetsCount: 2,
  strengthWeightDelta: 5,
  massSetsCount: 4,
  massAddDropSet: false,
  massBigCountCoef: 1.8,
  massWeightDelta: 2.5,
  lossCountStep: 2,
  lossCountMax: 16,
  lossMaxSets: 6,
  lossWeightDelta: 1.25,
};

const isEven = (n: number) => n % 2 === 0;

test("One-dumbbell exercises should always have even reps in progression", async (t) => {
  const strategy = new ProgressionStrategySimple(actionOneDb, opts);

  await t.test("mass progression enforces even reps", () => {
    const executed = makeExecuted([
      [20, 10],
      [22.5, 10],
      [25, 10],
      [27.5, 10],
    ]);
    const next = strategy.mass([], executed);
    next.forEach((s) => assert.isTrue(isEven(s.count), `rep ${s.count} is not even`));
  });

  await t.test("strength progression enforces even reps (including warmups)", () => {
    const executed = makeExecuted([
      [75, 3],
      [80, 2],
      [85, 1],
      [90, 1],
    ]);
    const next = strategy.strength([], executed);
    next.forEach((s) => assert.isTrue(isEven(s.count), `rep ${s.count} is not even`));
  });

  await t.test("loss progression enforces even reps (mean)", () => {
    const executed = makeExecuted([
      [20, 10],
      [20, 12],
      [20, 14],
    ]);
    const next = strategy.loss([{weight: 0, count: 0}], executed);
    next.forEach((s) => assert.isTrue(isEven(s.count), `rep ${s.count} is not even`));
  });
});
