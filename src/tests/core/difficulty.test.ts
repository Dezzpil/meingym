import { assert } from "chai";
import { test } from "node:test";
import {
  calculateExerciseDifficulty,
  calculateTrainingDifficulty,
} from "@/core/difficulty";
import { previewScore } from "@/core/scores";
import type { Purpose } from "@prisma/client";

const mockApproachGroup = {
  sum: 500,
  mean: 50,
  max: 100,
  countTotal: 10,
  countMean: 5,
};

test("previewScore()", async (context) => {
  await context.test(
    "should emphasize liftedMax and liftedSum for STRENGTH purpose",
    () => {
      const score = previewScore("STRENGTH" as Purpose, mockApproachGroup);
      const expected =
        0.5 * Math.log(mockApproachGroup.max) +
        0.5 * Math.log(mockApproachGroup.sum) -
        0.5 * Math.log(mockApproachGroup.countMean);

      assert.approximately(score, expected, 0.001);
    },
  );

  await context.test(
    "should emphasize liftedMean and liftedCountMean for MASS purpose",
    () => {
      const score = previewScore("MASS" as Purpose, mockApproachGroup);
      const expected =
        0.5 * Math.log(mockApproachGroup.mean) +
        0.25 * Math.log(mockApproachGroup.countMean) +
        0.25 * Math.log(mockApproachGroup.sum) +
        0.1 * Math.log(mockApproachGroup.max);

      assert.approximately(score, expected, 0.001);
    },
  );

  await context.test(
    "should emphasize liftedCountTotal and liftedCountMean for LOSS purpose",
    () => {
      const score = previewScore("LOSS" as Purpose, mockApproachGroup);
      const expected =
        0.5 * Math.log(mockApproachGroup.countTotal) +
        0.5 * Math.log(mockApproachGroup.countMean) +
        0.5 * Math.log(mockApproachGroup.max);

      assert.approximately(score, expected, 0.001);
    },
  );

  await context.test("should return 0 when all group values are 0", () => {
    const zeroGroup = { sum: 0, mean: 0, max: 0, countTotal: 0, countMean: 0 };
    const score = previewScore("STRENGTH" as Purpose, zeroGroup);

    assert.equal(score, 0);
  });

  await context.test("should handle very large values without overflow", () => {
    const largeGroup = {
      sum: Number.MAX_VALUE,
      mean: Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      countTotal: 1_000_000_000,
      countMean: 1_000_000_000,
    };
    const score = previewScore("MASS" as Purpose, largeGroup);

    assert.isFinite(score);
    assert.isAbove(score, 0);
  });
});

test("calculateExerciseDifficulty()", async (context) => {
  await context.test("should return action.base multiplied by previewScore", () => {
    const input = {
      action: { base: 2 },
      approachGroup: mockApproachGroup,
      purpose: "MASS" as Purpose,
    };
    const difficulty = calculateExerciseDifficulty(input);
    const expectedScore = previewScore("MASS" as Purpose, mockApproachGroup);

    assert.approximately(difficulty, input.action.base * expectedScore, 0.001);
  });

  await context.test("should return 0 when action.base is 0", () => {
    const input = {
      action: { base: 0 },
      approachGroup: mockApproachGroup,
      purpose: "STRENGTH" as Purpose,
    };

    assert.equal(calculateExerciseDifficulty(input), 0);
  });

  await context.test("should return 0 when approach group has all zeros", () => {
    const input = {
      action: { base: 5 },
      approachGroup: { sum: 0, mean: 0, max: 0, countTotal: 0, countMean: 0 },
      purpose: "LOSS" as Purpose,
    };

    assert.equal(calculateExerciseDifficulty(input), 0);
  });
});

test("calculateTrainingDifficulty()", async (context) => {
  await context.test("should sum exercise difficulties correctly", () => {
    const exercises = [
      {
        action: { base: 1 },
        approachGroup: mockApproachGroup,
        purpose: "MASS" as Purpose,
      },
      {
        action: { base: 2 },
        approachGroup: mockApproachGroup,
        purpose: "STRENGTH" as Purpose,
      },
    ];
    const total = calculateTrainingDifficulty(exercises);
    const expectedMass = calculateExerciseDifficulty(exercises[0]);
    const expectedStrength = calculateExerciseDifficulty(exercises[1]);

    assert.approximately(total, expectedMass + expectedStrength, 0.001);
  });

  await context.test("should return 0 for an empty array", () => {
    assert.equal(calculateTrainingDifficulty([]), 0);
  });

  await context.test("should handle a single exercise", () => {
    const exercises = [
      {
        action: { base: 3 },
        approachGroup: mockApproachGroup,
        purpose: "LOSS" as Purpose,
      },
    ];
    const total = calculateTrainingDifficulty(exercises);
    const expected = calculateExerciseDifficulty(exercises[0]);

    assert.approximately(total, expected, 0.001);
  });
});

function isBoostExecution(
  execution: { approachId: number | null },
  approaches: { id: number; isBoost: boolean }[],
): boolean {
  if (!execution.approachId) return false;
  const approach = approaches.find((a) => a.id === execution.approachId);
  return approach?.isBoost ?? false;
}

test("Boost filtering logic", async (context) => {
  const approaches = [
    { id: 1, isBoost: false },
    { id: 2, isBoost: true },
    { id: 3, isBoost: false },
  ];

  await context.test("should identify a boost approach execution", () => {
    assert.isTrue(isBoostExecution({ approachId: 2 }, approaches));
  });

  await context.test("should identify a non-boost approach execution", () => {
    assert.isFalse(isBoostExecution({ approachId: 1 }, approaches));
    assert.isFalse(isBoostExecution({ approachId: 3 }, approaches));
  });

  await context.test("should treat null approachId as non-boost", () => {
    assert.isFalse(isBoostExecution({ approachId: null }, approaches));
  });

  await context.test("should treat missing approach as non-boost", () => {
    assert.isFalse(isBoostExecution({ approachId: 999 }, approaches));
  });

  await context.test(
    "should include only non-boost executions when filtering",
    () => {
      const executions = [
        { id: 10, approachId: 1 },
        { id: 20, approachId: 2 },
        { id: 30, approachId: null },
        { id: 40, approachId: 3 },
      ];
      const included = executions.filter(
        (e) => !isBoostExecution(e, approaches),
      );

      assert.sameDeepMembers(
        included,
        [
          { id: 10, approachId: 1 },
          { id: 30, approachId: null },
          { id: 40, approachId: 3 },
        ],
        "boost execution should be excluded",
      );
    },
  );
});
