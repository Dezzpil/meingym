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

test("_upgradeStrengthPrepareSets 4", async (context) => {
  await context.test(
    "should build 4 prepared sets for 3 working set",
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

      const workingSets = strategy._upgradeStrengthWorkingSets(sets);
      assert.lengthOf(workingSets, opts.strengthWorkingSetsCount);
      console.log("workingSets", workingSets);

      assert.equal(str(workingSets[0]), "80x3");
      assert.equal(str(workingSets[1]), "90x3");
      assert.equal(str(workingSets[2]), "100x1");

      const prepSets = strategy._upgradeStrengthPrepareSets(workingSets);
      console.log(prepSets);
    },
  );
});
