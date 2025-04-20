import "./processors/scores";

// Import queues for direct access if needed
import { scoresQueue } from "./queues";
import { jobNames, defaultJobOptions } from "./config";

console.log("Job processors initialized");

// Export queues for use in other parts of the application
export { scoresQueue };

// Helper function to schedule score calculation for an action
export async function scheduleScoreCalculation(trainingId: number) {
  const job = await scoresQueue.add(
    jobNames.scores.calculateScores,
    { trainingId },
    defaultJobOptions,
  );

  return { jobId: job.id };
}
