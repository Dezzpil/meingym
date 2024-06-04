"use server";

import { TrainingDateFormFieldType } from "@/app/trainings/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/tools/auth";

export async function handleCreateTraining(data: TrainingDateFormFieldType) {
  const userId = await getCurrentUserId();
  const training = await prisma.training.create({
    data: {
      plannedTo: data.plannedTo,
      userId,
    },
  });

  redirect(`/trainings/${training.id}`);
}
