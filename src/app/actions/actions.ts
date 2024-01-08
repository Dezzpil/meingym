"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const muscleAgonyId = data.muscleAgonyId;
  const desc = data.desc;

  const existed = await prisma.actions.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  } else {
    const action = await prisma.actions.create({
      data: { title, muscleAgonyId, desc },
    });
    // TODO создать группу подходов с 3-мя подходами с какими-то весами

    revalidatePath(`/actions/${action.id}`);
    redirect(`/actions/${action.id}`);
  }
}
