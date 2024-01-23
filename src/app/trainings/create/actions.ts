"use server";

import { TrainingFormFieldsType } from "@/app/trainings/create/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";

export async function handleCreateTraining(data: TrainingFormFieldsType) {
  const training = await prisma.training.create({
    data: {
      planedTo: data.plannedTo,
    },
  });

  redirect(`/trainings/${training.id}`);
}
