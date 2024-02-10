"use server";

import { TrainingFormFieldsType } from "@/app/trainings/create/types";
import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { getPlannedToStr } from "@/tools/dates";

export async function handleCreateTraining(data: TrainingFormFieldsType) {
  console.log(data);
  const training = await prisma.training.create({
    data: {
      plannedTo: data.plannedTo,
      plannedToStr: getPlannedToStr(data.plannedTo),
    },
  });

  redirect(`/trainings/${training.id}`);
}
