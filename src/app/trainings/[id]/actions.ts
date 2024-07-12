"use server";

import {
  TrainingDateFormFieldType,
  TrainingFormFieldsType,
} from "@/app/trainings/types";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { createExercise } from "@/core/exercises";
import { redirect } from "next/navigation";
import { ServerActionResult } from "@/tools/types";
import moment from "moment";

export async function handleRepeatTraining(
  id: number,
  data: TrainingDateFormFieldType,
) {
  const training = await prisma.$transaction(async (tx) => {
    const curTraining = await tx.training.findUniqueOrThrow({
      where: { id },
      include: { TrainingExercise: { orderBy: { priority: "asc" } } },
    });

    const nextTraining = await tx.training.create({
      data: {
        plannedTo: data.plannedTo,
        userId: curTraining.userId,
      },
    });

    for (const exercise of curTraining.TrainingExercise) {
      await createExercise(
        nextTraining.id,
        exercise.actionId,
        exercise.purpose,
        curTraining.userId,
        tx,
      );
    }
    return nextTraining;
  });

  redirect(`/trainings/${training.id}`);
}

export async function handleTrainingUpdate(
  id: number,
  data: TrainingFormFieldsType,
  dateIsChanged: boolean,
): Promise<ServerActionResult | never> {
  try {
    if (dateIsChanged) {
      const date1 = moment(data.plannedTo);
      const date2 = moment(new Date());
      const diff = date1.diff(date2, "days");
      if (diff < 0) {
        throw new Error(`Можно перенести тренировку только на будущую дату`);
      }
    }
    await prisma.training.update({
      where: { id },
      data: Object.assign(
        {
          isCircuit: data.isCircuit,
          commonComment: data.commonComment,
        },
        dateIsChanged ? { plannedTo: data.plannedTo } : {},
      ),
    });
    revalidatePath(`/training/${id}`);
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  return { ok: true, error: null };
}
