import { ActionRig } from "@prisma/client";
import { assert } from "chai";
import { test } from "node:test";
import { calculateStats } from "@/core/stats";
import { SetData } from "@/core/types";

test("calculateStats: ветка для упражнений на длительность", async (context) => {
  await context.test(
    "Σ секунд, max/средний параметр, вес тела не прибавляется",
    function () {
      const sets: SetData[] = [
        { weight: 5, count: 30 },
        { weight: 6, count: 40 },
        { weight: 5, count: 50 },
      ];
      // userWeight=80 для duration игнорируется (rig OTHER, но isDurationBased=true)
      const stats = calculateStats(sets, ActionRig.OTHER, 80, true);
      assert.equal(stats.len, 3);
      assert.equal(stats.countSum, 120); // 30+40+50 секунд
      assert.equal(stats.countMean, 40); // 120/3
      assert.equal(stats.weightMax, 6); // максимальный параметр
      assert.equal(stats.weightMean, 16 / 3); // (5+6+5)/3
      assert.equal(stats.weightSum, 5 * 30 + 6 * 40 + 5 * 50); // Σ параметр×сек = 640
    },
  );

  await context.test(
    "без параметра (weight=0) накапливаются только секунды",
    function () {
      const sets: SetData[] = [
        { weight: 0, count: 30 },
        { weight: 0, count: 45 },
      ];
      const stats = calculateStats(sets, ActionRig.OTHER, 80, true);
      assert.equal(stats.countSum, 75);
      assert.equal(stats.weightMax, 0);
      assert.equal(stats.weightSum, 0);
      assert.equal(stats.weightMean, 0);
    },
  );

  await context.test("подходы с нулевыми секундами не учитываются", function () {
    const sets: SetData[] = [
      { weight: 5, count: 0 },
      { weight: 5, count: 30 },
    ];
    const stats = calculateStats(sets, ActionRig.OTHER, 80, true);
    assert.equal(stats.countSum, 30);
    assert.equal(stats.weightSum, 150);
    assert.equal(stats.weightMax, 5);
    // средние делятся на общее число подходов (как и в обычной ветке)
    assert.equal(stats.countMean, 15); // 30/2
    assert.equal(stats.weightMean, 2.5); // 5/2
  });

  await context.test(
    "для сравнения: обычная ветка прибавляет вес тела при rig OTHER",
    function () {
      const sets: SetData[] = [{ weight: 0, count: 10 }];
      const stats = calculateStats(sets, ActionRig.OTHER, 80, false);
      // weight = userWeight(80) + 0 = 80; 80*10 > 0
      assert.equal(stats.weightSum, 800);
      assert.equal(stats.weightMax, 80);
      assert.equal(stats.countSum, 10);
    },
  );
});
