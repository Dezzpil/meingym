// Configuration for the background job system

// Redis connection settings
export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Queue names
export const queueNames = {
  scores: "scores",
  periods: "periods",
};

// Job names
export const jobNames = {
  scores: {
    calculateScores: "calculate-scores",
  },
  periods: {
    checkInactive: "check-inactive-periods",
  },
};

// Default job options
export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: true,
};
