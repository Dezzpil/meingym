import { assert } from "chai";
import { test } from "node:test";
import {
  calculateBurnoutScore,
  isBurnoutRisk,
  BURNOUT_THRESHOLD,
} from "@/core/burnout";

test("calculateBurnoutScore()", async (context) => {
  await context.test("should return the average of 4 burnout answers", () => {
    const score = calculateBurnoutScore({
      exhaustion: 4,
      distance: 3,
      cognitive: 5,
      emotional: 2,
    });
    assert.approximately(score, 3.5, 0.001);
  });

  await context.test("should return 1 when all answers are 1", () => {
    const score = calculateBurnoutScore({
      exhaustion: 1,
      distance: 1,
      cognitive: 1,
      emotional: 1,
    });
    assert.equal(score, 1);
  });

  await context.test("should return 5 when all answers are 5", () => {
    const score = calculateBurnoutScore({
      exhaustion: 5,
      distance: 5,
      cognitive: 5,
      emotional: 5,
    });
    assert.equal(score, 5);
  });

  await context.test("should handle mixed values correctly", () => {
    const score = calculateBurnoutScore({
      exhaustion: 2,
      distance: 4,
      cognitive: 1,
      emotional: 3,
    });
    assert.approximately(score, 2.5, 0.001);
  });
});

test("isBurnoutRisk()", async (context) => {
  await context.test("should return false when score is below threshold", () => {
    assert.isFalse(isBurnoutRisk(2.0));
    assert.isFalse(isBurnoutRisk(BURNOUT_THRESHOLD - 0.1));
  });

  await context.test("should return true when score equals threshold", () => {
    assert.isTrue(isBurnoutRisk(BURNOUT_THRESHOLD));
  });

  await context.test("should return true when score is above threshold", () => {
    assert.isTrue(isBurnoutRisk(4.0));
    assert.isTrue(isBurnoutRisk(5.0));
  });
});

test("BURNOUT_THRESHOLD", () => {
  assert.equal(BURNOUT_THRESHOLD, 3.5);
});
