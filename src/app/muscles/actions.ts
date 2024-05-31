"use server";

import { MusclesFormFieldsType } from "@/app/muscles/create/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";
import { z } from "zod";
import { ServerActionResult } from "@/tools/types";

const MuscleDescFields = z.object({
  text: z.string(),
  link: z.string(),
});

export type MuscleDescType = z.infer<typeof MuscleDescFields>;

export async function handleMuscleAddDesc(
  muscleId: number,
  data: MuscleDescType,
) {
  await prisma.muscleDesc.create({
    data: {
      muscleId,
      text: data.text,
      link: data.link,
    },
  });
  revalidatePath(`/muscles/${muscleId}`);
}

export async function handleMuscleUpdateDesc(
  muscleId: number,
  id: number,
  data: MuscleDescType,
) {
  await prisma.muscleDesc.update({
    where: { id },
    data: {
      text: data.text,
      link: data.link,
    },
  });
  revalidatePath(`/muscles/${muscleId}`);
}

export async function handleMuscleDeleteDesc(muscleId: number, id: number) {
  await prisma.muscleDesc.delete({ where: { id } });
  revalidatePath(`/muscles/${muscleId}`);
}

export async function handleMuscleCreate(
  data: MusclesFormFieldsType,
): Promise<ServerActionResult | never> {
  const title = data.title as string;
  const existed = await prisma.muscle.findFirst({ where: { title } });
  if (existed) return { ok: false, error: `${title} уже существует` };

  const groupId = data.groupId;
  const muscle = await prisma.muscle.create({
    data: {
      title,
      groupId,
    },
  });

  redirect(`/muscles/${muscle.id}`);
}

export async function handleMuscleUpdate(
  id: number,
  data: MusclesFormFieldsType,
): Promise<ServerActionResult> {
  const title = data.title as string;

  const existed = await prisma.muscle.findFirst({
    where: { title, id: { not: id } },
  });
  if (existed) return { ok: false, error: `${title} уже существует` };

  const groupId = data.groupId;
  const muscle = await prisma.muscle.update({
    where: { id },
    data: {
      title,
      groupId,
    },
  });

  revalidatePath(`/muscles/${muscle.id}`);
  return { ok: true, error: null };
}

export async function handleDelete(id: number) {
  await prisma.muscle.delete({ where: { id } });
  redirect("/muscles");
}
