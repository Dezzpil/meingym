import Bull from "bull";
import { redisConfig, queueNames, jobNames } from "./config";
import { calculationScoreProcessor } from "@/jobs/processors/scores";

export const scoresQueue = new Bull(queueNames.scores, {
  redis: redisConfig,
});
scoresQueue.process(jobNames.scores.calculateScores, calculationScoreProcessor);
