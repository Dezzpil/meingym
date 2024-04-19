"use server";

import { ApproachLiftData } from "@/app/approaches/types";
import { prisma } from "@/tools/db";
import type { Purpose } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  createApproachGroup,
  linkNewApproachGroupToActionByPurpose,
} from "@/core/approaches";
import { calculateStats } from "@/core/stats";

export async function handleUpdateApproachGroup(
  id: number,
  data: Array<ApproachLiftData>,
  trainingId?: number,
) {
  const stats = calculateStats(data);
  await prisma.$transaction(async (tx) => {
    const approachesData = data.map((d) => Object.assign(d, { groupId: id }));
    await tx.approach.deleteMany({ where: { groupId: id } });
    await tx.approach.createMany({ data: approachesData });
    await tx.approachesGroup.update({
      where: { id },
      data: stats,
    });
  });
  if (trainingId) {
    revalidatePath(`/trainings/${trainingId}`);
  }
}

export async function handleCreateNewApproachesGroup(
  purpose: Purpose,
  purposeId: number,
  data: Array<ApproachLiftData>,
  actionId: number,
) {
  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    const newGroup = await createApproachGroup(tx, data, actionId, userId);
    await linkNewApproachGroupToActionByPurpose(
      tx,
      purpose,
      purposeId,
      newGroup,
    );
  });
}
