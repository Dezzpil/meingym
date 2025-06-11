import "./processors/scores";
import "./processors/periods";
import "./processors/images";

// Import queues for direct access if needed
import { scoresQueue, periodsQueue, imagesQueue } from "./queues";
import { jobNames, defaultJobOptions } from "./config";

console.log("Job processors initialized");

// Export queues for use in other parts of the application
export { scoresQueue, periodsQueue, imagesQueue };

// Helper function to schedule score calculation for an action
export async function scheduleScoreCalculation(trainingId: number) {
  const job = await scoresQueue.add(
    jobNames.scores.calculateScores,
    { trainingId },
    defaultJobOptions,
  );

  return { jobId: job.id };
}

// Helper function to schedule checking for inactive periods
export async function scheduleCheckInactivePeriods() {
  const job = await periodsQueue.add(
    jobNames.periods.checkInactive,
    {},
    {
      ...defaultJobOptions,
      repeat: {
        cron: '0 0 * * *', // Run once a day at midnight
      },
    },
  );

  return { jobId: job.id };
}

// Helper function to schedule cleanup of orphaned images
export async function scheduleCleanupOrphanedImages() {
  const job = await imagesQueue.add(
    jobNames.images.cleanupOrphaned,
    {},
    {
      ...defaultJobOptions,
      repeat: {
        cron: '0 3 * * *', // Run once a day at 3 AM
      },
    },
  );

  return { jobId: job.id };
}

// Schedule the check for inactive periods to run daily
scheduleCheckInactivePeriods().catch(console.error);

// Schedule the cleanup of orphaned images to run daily
scheduleCleanupOrphanedImages().catch(console.error);
