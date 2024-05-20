"use server";

import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  ApproachesMassBigCountDefault,
  ApproachesMassBodyDefault,
  ApproachesMassDefault,
  ApproachesStrengthDefault,
  createApproachGroup,
} from "@/core/approaches";
import { ActionRig } from "@prisma/client";

export async function handleRemoveAction(actionId: number) {
  await prisma.action.delete({ where: { id: actionId } });
  redirect(`/actions`);
}

export async function handleCreateStrengthInitial(actionId: number) {
  const userId = await getCurrentUserId();
  const action = await prisma.action.findUniqueOrThrow({
    where: { id: actionId },
  });
  if (!action.strengthAllowed)
    throw new Error(
      `Нельзя создать базовые силовые значения для движения, которое не подходит для силовых тренировок`,
    );
  await prisma.$transaction(async (tx) => {
    const newGroup = await createApproachGroup(
      tx,
      ApproachesStrengthDefault,
      actionId,
      userId,
    );
    await tx.actionStrength.deleteMany({ where: { userId, actionId } });
    await tx.actionStrength.create({
      data: {
        actionId,
        userId,
        currentApproachGroupId: newGroup.id,
      },
    });
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
    const defaults =
      actionRig === ActionRig.OTHER
        ? ApproachesMassBodyDefault
        : actionBigCount
          ? ApproachesMassBigCountDefault
          : ApproachesMassDefault;
    const newGroup = await createApproachGroup(tx, defaults, actionId, userId);
    await tx.actionMass.deleteMany({ where: { userId, actionId } });
    await tx.actionMass.create({
      data: {
        actionId,
        userId,
        currentApproachGroupId: newGroup.id,
      },
    });
  });
  revalidatePath(`/actions/${actionId}`);
}
