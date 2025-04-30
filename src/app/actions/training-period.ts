"use server";

import { createTrainingPeriod, endCurrentTrainingPeriod } from "@/core/periods";
import { ProgressionStrategySimpleOptsType } from "@/core/progression/strategy/simple";
import { revalidatePath } from "next/cache";

/**
 * Server action to create a new training period
 */
export async function createTrainingPeriodAction(
  userId: string,
  progressionOpts: ProgressionStrategySimpleOptsType,
) {
  try {
    await createTrainingPeriod(userId, progressionOpts);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating training period:", error);
    return { success: false, error: "Failed to create training period" };
  }
}

/**
 * Server action to end the current training period
 */
export async function endTrainingPeriodAction(userId: string) {
  try {
    await endCurrentTrainingPeriod(userId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error ending training period:", error);
    return { success: false, error: "Failed to end training period" };
  }
}
