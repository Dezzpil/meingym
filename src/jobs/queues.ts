import Bull from "bull";
import { redisConfig, queueNames, jobNames } from "./config";
import { calculationScoreProcessor } from "@/jobs/processors/scores";
import { checkInactivePeriodsProcessor } from "@/jobs/processors/periods";
import { cleanupImagesProcessor } from "@/jobs/processors/images";

export const scoresQueue = new Bull(queueNames.scores, {
  redis: redisConfig,
});
scoresQueue.process(jobNames.scores.calculateScores, calculationScoreProcessor);

export const periodsQueue = new Bull(queueNames.periods, {
  redis: redisConfig,
});
periodsQueue.process(jobNames.periods.checkInactive, checkInactivePeriodsProcessor);

export const imagesQueue = new Bull(queueNames.images, {
  redis: redisConfig,
});
imagesQueue.process(jobNames.images.cleanupOrphaned, cleanupImagesProcessor);
