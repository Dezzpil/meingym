"use server";

import { TrainingDateFormFieldType } from "@/app/trainings/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { getCurrentTrainingPeriod } from "@/core/periods";

export async function handleCreateTraining(data: TrainingDateFormFieldType) {
  const userId = await getCurrentUserId();
  const userInfo = await findUserInfo(userId);
  const currentPeriod = await getCurrentTrainingPeriod(userId);

  const training = await prisma.training.create({
    data: Object.assign(
      {
        plannedTo: data.plannedTo,
        userId,
        periodId: currentPeriod?.id,
      },
      userInfo.purpose === "LOSS" ? { isCircuit: true } : {},
    ),
  });

  redirect(`/trainings/${training.id}`);
}
