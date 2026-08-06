import type { Job } from "bull";
import { prisma } from "@/tools/db";
import { processCompletedTrainingCore } from "@/core/trainingProcessing";

type TrainingProcessingPayload = {
  trainingId: number;
  userId: string;
};

export const trainingProcessingProcessor = async (
  job: Job<TrainingProcessingPayload>,
) => {
  const { trainingId, userId } = job.data;
  console.log(`Processing completed training ${trainingId}...`);

  try {
    await processCompletedTrainingCore(trainingId, userId);
    return {
      success: true,
      message: `Successfully processed training ${trainingId}`,
    };
  } catch (error) {
    console.error(`Error processing training ${trainingId}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
