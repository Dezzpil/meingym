import { prisma } from "@/tools/db";
import { endCurrentTrainingPeriod } from "@/core/periods";

/**
 * Processor for checking inactive periods and ending them if the last training was more than a week ago.
 * 
 * This job:
 * 1. Finds all current training periods
 * 2. For each period, checks when the last completed training was
 * 3. If the last training was more than a week ago, ends the period
 */
export const checkInactivePeriodsProcessor = async (job: any) => {
  console.log("Checking for inactive training periods...");

  try {
    // Find all current training periods
    const currentPeriods = await prisma.trainingPeriod.findMany({
      where: { 
        isCurrent: true,
      },
      include: {
        // Include the most recent completed training for each period
        Trainings: {
          where: {
            completedAt: { not: null }
          },
          orderBy: {
            completedAt: "desc"
          },
          take: 1
        }
      }
    });

    console.log(`Found ${currentPeriods.length} current training periods`);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let endedPeriodsCount = 0;

    // Check each period for inactivity
    for (const period of currentPeriods) {
      const lastTraining = period.Trainings[0];
      
      // If there are no completed trainings or the last training was more than a week ago
      if (!lastTraining || (lastTraining.completedAt && lastTraining.completedAt < oneWeekAgo)) {
        console.log(`Ending inactive period ${period.id} for user ${period.userId}`);
        
        // End the current period
        await endCurrentTrainingPeriod(period.userId);
        endedPeriodsCount++;
      }
    }

    return {
      success: true,
      message: `Successfully checked inactive periods. Ended ${endedPeriodsCount} inactive periods.`,
    };
  } catch (error) {
    console.error("Error checking inactive periods:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};