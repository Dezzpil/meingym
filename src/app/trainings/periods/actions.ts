"use server";

import {
  createTrainingPeriod,
  endCurrentTrainingPeriod,
  updateProgressionStrategySimpleOpts,
} from "@/core/periods";
import { ProgressionStrategySimpleOptsType } from "@/core/progression/strategy/simple";
import { revalidatePath } from "next/cache";

/**
 * Server action to create a new training period
 */
export async function createTrainingPeriodAction(userId: string) {
  await createTrainingPeriod(userId);
  revalidatePath("/");
}

/**
 * Server action to end the current training period
 */
export async function endTrainingPeriodAction(userId: string) {
  await endCurrentTrainingPeriod(userId);
  revalidatePath("/");
}

export async function handleUpdateProgressionStrategySimpleOpts(
  id: number,
  opts: ProgressionStrategySimpleOptsType,
) {
  await updateProgressionStrategySimpleOpts(id, opts);
  revalidatePath("/profile");
}
