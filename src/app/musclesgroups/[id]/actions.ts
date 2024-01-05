"use server";

import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function handleModify(id: number, data: any) {}

export async function handleDelete(id: number) {
  await prisma.muscleGroup.delete({ where: { id } });
  revalidatePath(`/musclesgroups`);
  redirect(`/musclesgroups`);
}
