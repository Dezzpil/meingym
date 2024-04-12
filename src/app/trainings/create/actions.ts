"use server";

import { TrainingFormFieldsType } from "@/app/trainings/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";

export async function handleCreateTraining(data: TrainingFormFieldsType) {
  const training = await prisma.training.create({
    data: {
      plannedTo: data.plannedTo,
    },
  });

  redirect(`/trainings/${training.id}`);
}
