"use server";

import { TrainingFormFieldsType } from "@/app/trainings/types";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";

export async function handleChangeTrainingDate(
  id: number,
  data: TrainingFormFieldsType,
) {
  await prisma.training.update({
    where: { id },
    data: { plannedTo: data.plannedTo },
  });

  revalidatePath(`/trainings/${id}`);
}
