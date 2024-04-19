"use server";

import { TrainingFormFieldsType } from "@/app/trainings/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/tools/auth";

export async function handleCreateTraining(data: TrainingFormFieldsType) {
  const userId = await getCurrentUserId();
  const training = await prisma.training.create({
    data: {
      plannedTo: data.plannedTo,
      userId,
    },
  });

  redirect(`/trainings/${training.id}`);
}
