import { assert } from "chai";
import { test } from "node:test";
import { scoreNormalized, norm, ScoreCoefficients } from "@/core/scores";
import type { Purpose, TrainingExercise } from "@prisma/client";

test("Score calculation", async (context) => {
  await context.test("should calculate scores correctly for MASS purpose", () => {
    // Create a mock exercise with some values
    const mockExercise: Partial<TrainingExercise> = {
      liftedMax: 100,
      liftedSum: 500,
      liftedMean: 50,
      liftedCountTotal: 10,
      liftedCountMean: 5,
      purpose: "MASS" as Purpose,
    };
    
    // Normalize the exercise data
    const normalized = norm(mockExercise as TrainingExercise);
    
    // Calculate the score
    const { score, coefficients } = scoreNormalized("MASS" as Purpose, normalized);
    
    // Verify that liftedMaxNorm has a positive coefficient (should be 0.1 after our change)
    assert.isTrue(coefficients.liftedMaxNorm > 0, "liftedMaxNorm coefficient should be positive");
    assert.equal(coefficients.liftedMaxNorm, 0.1, "liftedMaxNorm coefficient should be 0.1");
    
    // Verify that the score calculation includes a positive contribution from liftedMaxNorm
    const liftedMaxContribution = normalized.liftedMaxNorm * coefficients.liftedMaxNorm;
    assert.isTrue(liftedMaxContribution > 0, "liftedMaxNorm should contribute positively to the score");
    
    // Verify the total score is as expected
    const expectedScore = 
      normalized.liftedMeanNorm * 0.5 +
      normalized.liftedCountMeanNorm * 0.25 +
      normalized.liftedSumNorm * 0.25 +
      normalized.liftedMaxNorm * 0.1;
    
    assert.approximately(score, expectedScore, 0.001, "Score should be calculated correctly");
  });
  
  await context.test("should calculate scores correctly for STRENGTH purpose", () => {
    // Create a mock exercise with some values
    const mockExercise: Partial<TrainingExercise> = {
      liftedMax: 100,
      liftedSum: 500,
      liftedMean: 50,
      liftedCountTotal: 10,
      liftedCountMean: 5,
      purpose: "STRENGTH" as Purpose,
    };
    
    // Normalize the exercise data
    const normalized = norm(mockExercise as TrainingExercise);
    
    // Calculate the score
    const { score, coefficients } = scoreNormalized("STRENGTH" as Purpose, normalized);
    
    // Verify the coefficients
    assert.equal(coefficients.liftedMaxNorm, 0.5, "liftedMaxNorm coefficient should be 0.5");
    assert.equal(coefficients.liftedSumNorm, 0.5, "liftedSumNorm coefficient should be 0.5");
    assert.equal(coefficients.liftedCountMeanNorm, -0.5, "liftedCountMeanNorm coefficient should be -0.5");
    
    // Verify the total score is as expected
    const expectedScore = 
      normalized.liftedMaxNorm * 0.5 +
      normalized.liftedSumNorm * 0.5 +
      normalized.liftedCountMeanNorm * -0.5;
    
    assert.approximately(score, expectedScore, 0.001, "Score should be calculated correctly");
  });
});