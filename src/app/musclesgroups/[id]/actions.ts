"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/tools/db";

export async function handleDelete(id: number) {
  await prisma.muscleGroup.delete({ where: { id } });
  revalidatePath(`/musclesgroups`);
  redirect(`/musclesgroups`);
}
