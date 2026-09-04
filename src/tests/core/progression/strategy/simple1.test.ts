import { SetData } from "@/core/types";
import { assert } from "chai";
import { test } from "node:test";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";

const str = (set: SetData): string => `${set.weight}x${set.count}`;

const opts = {
  strengthWorkingSetsCount: 3,
  strengthPrepareSetsCount: 4,
  strengthWeightDelta: 5,
  massSetsCount: 4,
  massAddDropSet: false,
  massBigCountCoef: 1.8,
  massWeightDelta: 2.5,
  lossCountStep: 2,
  lossCountMax: 16,
  lossMaxSets: 6,
  lossWeightDelta: 1.25,
  durationSetsCount: 3,
  durationStepSec: 10,
  durationMaxSec: 120,
  durationParamStep: 1,
  durationMaxSets: 5,
};

const strategy = new ProgressionStrategySimple(
  {
    rig: "BARBELL",
    bigCount: false,
    oneDumbbell: false,
    isDurationBased: false,
    durationParamLabel: null,
  },
  opts,
);

test("_upgradeStrengthWorkingSets 3", async (context) => {
  await context.test(
    "should keep max (100x1) and increase already completed (90x2) with 3 working set",
    function () {
      const sets: SetData[] = [
        { weight: 40, count: 12 },
        { weight: 50, count: 8 },
        { weight: 70, count: 6 },
        { weight: 80, count: 3 },
        { weight: 90, count: 2 }, // already 2!
        { weight: 100, count: 1 },
        { weight: 80, count: 3 },
        { weight: 80, count: 3 },
        { weight: 80, count: 3 },
      ];

      const sets1 = strategy._upgradeStrengthWorkingSets(sets);
      assert.lengthOf(sets1, opts.strengthWorkingSetsCount);

      // console.log(sets1);
      assert.equal(str(sets1[0]), "80x3");
      assert.equal(str(sets1[1]), "90x3");
      assert.equal(str(sets1[2]), "100x1");

      const sets2 = strategy._upgradeStrengthWorkingSets(sets1);
      // console.log(sets2);
      assert.equal(str(sets2[0]), "80x3");
      assert.equal(str(sets2[1]), "90x3");
      assert.equal(str(sets2[2]), "100x2");

      const sets3 = strategy._upgradeStrengthWorkingSets(sets2);
      // console.log(sets3);
      assert.equal(str(sets3[0]), "80x3");
      assert.equal(str(sets3[1]), "90x3");
      assert.equal(str(sets3[2]), "100x3");

      const sets4 = strategy._upgradeStrengthWorkingSets(sets3);
      // console.log("sets4", sets4);
      assert.equal(str(sets4[0]), "95x1");
      assert.equal(str(sets4[1]), "100x1");
      assert.equal(str(sets4[2]), "105x1");

      const sets5 = strategy._upgradeStrengthWorkingSets(sets4);
      // console.log("set5", sets5);
      assert.equal(str(sets5[0]), "95x2");
      assert.equal(str(sets5[1]), "100x1");
      assert.equal(str(sets5[2]), "105x1");
    },
  );
});

test("_upgradeStrengthWorkingSets 4", async (context) => {
  await context.test(
    "should keep max (100x1) and increase already completed (90x2) with 4 working set",
    function () {
      const sets: SetData[] = [
        { weight: 40, count: 12 },
        { weight: 50, count: 8 },
        { weight: 70, count: 6 },
        { weight: 80, count: 3 },
        { weight: 90, count: 2 }, // already 2!
        { weight: 100, count: 1 },
        { weight: 80, count: 3 },
        { weight: 80, count: 3 },
        { weight: 80, count: 3 },
      ];

      const optsCustom = Object.assign(opts, { strengthWorkingSetsCount: 4 });

      const sets1 = strategy._upgradeStrengthWorkingSets(sets, optsCustom);
      assert.lengthOf(sets1, optsCustom.strengthWorkingSetsCount);

      console.log("sets1", sets1);
      assert.equal(str(sets1[0]), "70x3");
      assert.equal(str(sets1[1]), "80x3");
      assert.equal(str(sets1[2]), "90x3");
      assert.equal(str(sets1[3]), "100x1");

      const sets2 = strategy._upgradeStrengthWorkingSets(sets1, optsCustom);
      console.log("sets2", sets2);
      assert.equal(str(sets2[0]), "70x3");
      assert.equal(str(sets2[1]), "80x3");
      assert.equal(str(sets2[2]), "90x3");
      assert.equal(str(sets2[3]), "100x2");

      const sets3 = strategy._upgradeStrengthWorkingSets(sets2, optsCustom);
      console.log("sets3", sets3);
      assert.equal(str(sets3[0]), "70x3");
      assert.equal(str(sets3[1]), "80x3");
      assert.equal(str(sets3[2]), "90x3");
      assert.equal(str(sets3[3]), "100x3");

      const sets4 = strategy._upgradeStrengthWorkingSets(sets3, optsCustom);
      console.log("sets4", sets4);
      assert.equal(str(sets4[0]), "90x1");
      assert.equal(str(sets4[1]), "95x1");
      assert.equal(str(sets4[2]), "100x1");
      assert.equal(str(sets4[3]), "105x1");

      const sets5 = strategy._upgradeStrengthWorkingSets(sets4, optsCustom);
      console.log("set5", sets5);
      assert.equal(str(sets5[0]), "90x2");
      assert.equal(str(sets5[1]), "95x1");
      assert.equal(str(sets5[2]), "100x1");
      assert.equal(str(sets5[3]), "105x1");
    },
  );
});
