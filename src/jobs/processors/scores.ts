import { prisma } from "@/tools/db";
import { createScore } from "@/core/scores";

export const calculationScoreProcessor = async (job: any) => {
  const { trainingId } = job.data;
  console.log(`Calculating scores for execution by training ${trainingId} ...`);

  try {
    // Fetch the training exercise data for the action
    const exercises = await prisma.trainingExercise.findMany({
      where: { trainingId },
      include: {
        Training: true,
      },
    });

    for (const exercise of exercises) {
      console.log("exercise", exercise.id);
      const item = await createScore(exercise);
      console.log("item", item);
    }

    return {
      success: true,
      message: `Successfully calculated scores for all exercises in training ${trainingId}`,
    };
  } catch (error) {
    console.error(
      `Error calculating scores for training ${trainingId}:`,
      error,
    );
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
