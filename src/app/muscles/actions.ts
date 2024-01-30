"use server";

import { MusclesFormFieldsType } from "@/app/muscles/create/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";

export async function handleCreate(data: MusclesFormFieldsType) {
  const title = data.title as string;
  const groupId = data.groupId;
  await prisma.muscle.create({
    data: {
      title,
      groupId,
    },
  });

  revalidatePath("/muscles");
  redirect("/muscles");
}

export async function handleDelete(id: number) {
  await prisma.muscle.delete({ where: { id } });
  revalidatePath("/muscles");
  redirect("/muscles");
}
