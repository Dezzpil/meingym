"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { z } from "zod";

const MuscleGroupDescFields = z.object({
  text: z.string(),
  link: z.string(),
});

export type MuscleGroupDescType = z.infer<typeof MuscleGroupDescFields>;

export async function handleMuscleGroupDelete(id: number) {
  await prisma.muscleGroup.delete({ where: { id } });
  redirect(`/musclesgroups`);
}

export async function handleMuscleGroupAddDesc(
  groupId: number,
  data: MuscleGroupDescType,
) {
  await prisma.muscleGroupDesc.create({
    data: {
      groupId,
      text: data.text,
      link: data.link,
    },
  });
  revalidatePath(`/musclesgroups/${groupId}`);
}

export async function handleMuscleGroupUpdateDesc(
  groupId: number,
  id: number,
  data: MuscleGroupDescType,
) {
  await prisma.muscleGroupDesc.update({
    where: { id },
    data: {
      text: data.text,
      link: data.link,
    },
  });
  revalidatePath(`/musclesgroups/${groupId}`);
}

export async function handleMuscleGroupDeleteDesc(groupId: number, id: number) {
  await prisma.muscleGroupDesc.delete({ where: { id } });
  revalidatePath(`/musclesgroups/${groupId}`);
}
