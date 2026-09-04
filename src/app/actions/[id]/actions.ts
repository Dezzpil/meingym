"use server";

import { prisma } from "@/tools/db";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  createDurationInitial,
  createLossInitial,
  createMassInitial,
  createStrengthInitial,
} from "@/core/approaches";
import { ActionRig } from "@prisma/client";

export async function handleCreateStrengthInitial(actionId: number) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    await createStrengthInitial(userId, actionId, tx);
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
    const action = await tx.action.findUniqueOrThrow({ where: { id: actionId } });
    if (action.isDurationBased) {
      await createDurationInitial(userId, actionId, tx);
    } else {
      await createLossInitial(userId, actionId, actionRig, actionBigCount, tx);
    }
  });
  revalidatePath(`/actions/${actionId}`);
}
