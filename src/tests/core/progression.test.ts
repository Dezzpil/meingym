import { ActionRig } from ".prisma/client";
import { SetData } from "@/core/types";
import { calculateStats } from "@/core/stats";
import { defineIncreaseForStrengthSets } from "@/core/progression";
import { assert } from "chai";
import { test } from "node:test";

test("#defineIncreaseForStrengthSets", async (context) => {
  await context.test("should increase sum", function () {
    const sets: SetData[] = [
      { weight: 100, count: 1 },
      { weight: 90, count: 2 },
      { weight: 80, count: 3 },
    ];
    const was = calculateStats(sets, ActionRig.BARBELL, 0);
    const increased = defineIncreaseForStrengthSets(sets);
    const become = calculateStats(increased, ActionRig.BARBELL, 0);

    assert.isAbove(become.sum, was.sum);
  });
});
