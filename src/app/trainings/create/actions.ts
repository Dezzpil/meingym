"use server";

import { TrainingDateFormFieldType } from "@/app/trainings/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { createTrainingPeriod, getCurrentTrainingPeriod } from "@/core/periods";

export async function handleCreateTraining(data: TrainingDateFormFieldType) {
  const userId = await getCurrentUserId();
  const userInfo = await findUserInfo(userId);

  let currentPeriod = await getCurrentTrainingPeriod(userId);
  if (!currentPeriod) {
    currentPeriod = await createTrainingPeriod(userId);
  }

  const training = await prisma.training.create({
    data: Object.assign(
      {
        plannedTo: data.plannedTo,
        userId,
        periodId: currentPeriod.id,
      },
      userInfo.purpose === "LOSS" ? { isCircuit: true } : {},
    ),
  });

  // ensure warm-up exists for this training
  try {
    // @ts-ignore - model may not be in generated types until prisma generate
    await prisma.trainingWarmUp.create({ data: { trainingId: training.id } });
  } catch (e) {
    // ignore if already exists (unique constraint)
  }

  redirect(`/trainings/${training.id}`);
}
