"use server";

import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  createLossInitial,
  createMassInitial,
  createStrengthInitial,
} from "@/core/approaches";
import { ActionRig } from "@prisma/client";

export async function handleRemoveAction(actionId: number) {
  await prisma.action.delete({ where: { id: actionId } });
  redirect(`/actions`);
}

export async function handleCreateStrengthInitial(
  actionId: number,
  actionStrAllowed: boolean,
) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    await createStrengthInitial(userId, actionId, actionStrAllowed, tx);
  });
  revalidatePath(`/actions/${actionId}`);
}

export async function handleCreateMassInitial(
  actionId: number,
  actionRig: ActionRig,
  actionBigCount: boolean,
) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    await createMassInitial(userId, actionId, actionRig, actionBigCount, tx);
  });
  revalidatePath(`/actions/${actionId}`);
}

// TODO добавить кнопку и компонент для создания со страницы Движения
export async function handleCreateLossInitial(
  actionId: number,
  actionRig: ActionRig,
  actionBigCount: boolean,
) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    await createLossInitial(userId, actionId, actionRig, actionBigCount, tx);
  });
  revalidatePath(`/actions/${actionId}`);
}
