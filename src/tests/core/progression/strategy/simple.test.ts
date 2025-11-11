import { ActionRig } from ".prisma/client";
import { SetData, SetDataExecuted } from "@/core/types";
import { calculateStats } from "@/core/stats";
import { assert } from "chai";
import { test } from "node:test";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";

const str = (set: SetData): string => `${set.weight}x${set.count}`;

const strategy = new ProgressionStrategySimple(
  {
    rig: "BARBELL",
    strengthAllowed: true,
    bigCount: false,
    oneDumbbell: false,
  },
  {
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
  },
);

test("_upgradeStrengthWorkingSets", async (context) => {
  await context.test("should pick only limited sets count", function () {
    const sets: SetData[] = [
      { weight: 75, count: 1 },
      { weight: 80, count: 1 },
      { weight: 85, count: 1 },
      { weight: 90, count: 1 },
      { weight: 95, count: 1 },
    ];
    const sets1 = strategy._upgradeStrengthWorkingSets(sets, 5);
    assert.lengthOf(sets1, strategy._opts.strengthWorkingSetsCount);
    assert.equal(str(sets1[0]), "80x2");
    assert.equal(str(sets1[1]), "85x1");
  });

  /**
   * Представлю, что это моя становая на текущий момент.
   * Представлю, что максимум сейчас я могу поднять 110.
   * Значит берем 80% от этого: 110 / 100 * 80 = 88, округлим до ближайшего - 90
   * 90x1, 85x1, 80x2, 75x3 - baseline
   * 90x1, 85x1, 80x3, 75x4
   * 90x1, 85x2, 80x3, 75x4
   * 95x1, 90x1, 85x2, 80x3 - progress, and new baseline
   */
  await context.test("should increase data 1", function () {
    const sets: SetData[] = [
      { weight: 75, count: 3 },
      { weight: 80, count: 2 },
      { weight: 85, count: 1 },
      { weight: 90, count: 1 },
    ];

    const add = 5;

    const sets1 = strategy._upgradeStrengthWorkingSets(sets, add);
    assert.equal(str(sets1[0]), "75x4");
    assert.equal(str(sets1[1]), "80x2");

    const sets2 = strategy._upgradeStrengthWorkingSets(sets1, add);
    assert.equal(str(sets2[0]), "75x4");
    assert.equal(str(sets2[1]), "80x3");

    const sets3 = strategy._upgradeStrengthWorkingSets(sets2, add);
    assert.equal(str(sets3[0]), "75x4");
    assert.equal(str(sets3[1]), "80x3");
    assert.equal(str(sets3[2]), "85x2");

    const sets4 = strategy._upgradeStrengthWorkingSets(sets3, add);
    assert.equal(str(sets4[0]), "80x3");
    assert.equal(str(sets4[1]), "85x2");
    assert.equal(str(sets4[2]), "90x1");
    assert.equal(str(sets4[3]), "95x1");

    const was = calculateStats(sets, ActionRig.BARBELL, 0);
    const now = calculateStats(sets4, ActionRig.BARBELL, 0);

    assert.isAbove(now.weightMean, was.weightMean);
    assert.equal(now.weightMean - was.weightMean, add);

    assert.isAbove(now.weightSum, was.weightSum);
  });

  await context.test("should increase data 2", function () {
    const sets: SetData[] = [
      { weight: 75, count: 3 },
      { weight: 80, count: 2 },
      { weight: 85, count: 1 },
      { weight: 90, count: 1 },
      { weight: 95, count: 1 },
      { weight: 100, count: 1 },
    ];

    const sets1 = strategy._upgradeStrengthWorkingSets(sets, 5);
    assert.equal(str(sets1[0]), "85x2");
    assert.equal(str(sets1[1]), "90x1");
    assert.equal(str(sets1[2]), "95x1");
    assert.equal(str(sets1[3]), "100x1");
  });

  await context.test("should increase data 3", function () {
    const sets: SetData[] = [
      { weight: 75, count: 3 },
      { weight: 80, count: 2 },
      { weight: 85, count: 1 },
      { weight: 90, count: 0 },
      { weight: 95, count: 0 },
    ];

    const sets1 = strategy._upgradeStrengthWorkingSets(sets, 5);
    assert.equal(str(sets1[0]), "70x3");
    assert.equal(str(sets1[1]), "75x2");
    assert.equal(str(sets1[2]), "80x1");
    assert.equal(str(sets1[3]), "85x1");
  });
});

test("_upgradeStrengthPrepareSets", async (context) => {
  await context.test("should create prepare sets 1", function () {
    const workingSets: SetData[] = [{ weight: 70, count: 3 }];
    const prepareSets = strategy._upgradeStrengthPrepareSets(workingSets, 5);
    assert.equal(str(prepareSets[0]), "50x12");
    assert.equal(str(prepareSets[1]), "60x6");
  });
  await context.test("should create prepare sets 2", function () {
    const workingSets: SetData[] = [{ weight: 70, count: 4 }];
    const prepareSets = strategy._upgradeStrengthPrepareSets(workingSets, 5);
    assert.equal(str(prepareSets[0]), "50x12");
    assert.equal(str(prepareSets[1]), "60x8");
  });
});

test("mass", async (context) => {
  await context.test("should normalize sets count", function () {
    const sets: SetDataExecuted[] = [
      {
        weight: 30,
        count: 12,
        burning: "",
        cheating: "",
        rating: "",
        refusing: "",
      },
    ];
    const upgraded = strategy.mass(sets, sets);
    assert.lengthOf(upgraded, strategy._opts.massSetsCount);
  });
  await context.test("should upgrade load in sets", function () {
    const sets: SetDataExecuted[] = [
      {
        weight: 30,
        count: 14,
        burning: "",
        cheating: "",
        rating: "",
        refusing: "",
      },
    ];
    const upgraded = strategy.mass(sets, sets);
    assert.isAbove(upgraded[0].count, sets[0].count);
    assert.isAbove(upgraded[1].weight, sets[0].weight);
  });
});

test("loss", async (context) => {
  await context.test("should increase counts for all sets", function () {
    const sets: SetData[] = [
      { weight: 10, count: 8 },
      { weight: 10, count: 8 },
      { weight: 10, count: 8 },
      { weight: 10, count: 8 },
    ];
    const upgraded = strategy.loss(sets, sets as unknown as SetDataExecuted[]);
    assert.equal(upgraded[0].count, 12);
    assert.equal(upgraded[0].weight, 10);

    const upgraded2 = strategy.loss(
      sets,
      upgraded as unknown as SetDataExecuted[],
    );
    assert.equal(upgraded2[0].count, 16);
    assert.equal(upgraded2[0].weight, 10);

    const upgraded3 = strategy.loss(
      sets,
      upgraded2 as unknown as SetDataExecuted[],
    );
    assert.equal(upgraded3[0].count, 8);
    assert.equal(upgraded3[0].weight, 10);
    assert.notEqual(upgraded2.length, upgraded3.length);
  });
});
