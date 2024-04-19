"use server";

import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  ApproachesMassDefault,
  ApproachesStrengthDefault,
  createApproachGroup,
} from "@/core/approaches";

export async function handleRemoveAction(actionId: number) {
  await prisma.action.delete({ where: { id: actionId } });
  redirect(`/actions`);
}

export async function handleCreateStrengthInitial(actionId: number) {
  const userId = await getCurrentUserId();
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

export async function handleCreateMassInitial(actionId: number) {
  const userId = await getCurrentUserId();
  await prisma.$transaction(async (tx) => {
    const newGroup = await createApproachGroup(
      tx,
      ApproachesMassDefault,
      actionId,
      userId,
    );
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
