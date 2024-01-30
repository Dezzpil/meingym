"use server";

import { redirect } from "next/navigation";
import { MusclesGroupsFormFieldsType } from "@/app/musclesgroups/create/types";
import { prisma } from "@/tools/db";

export async function handleSubmitAction(data: MusclesGroupsFormFieldsType) {
  const existed = await prisma.muscleGroup.findMany({
    where: { title: data.title },
  });
  if (existed.length) throw new Error(`группа ${data.title} уже существует`);

  const group = await prisma.muscleGroup.create({ data: data });

  redirect(`/musclesgroups/${group.id}`);
}
