"use server";

import { prisma } from "@/tools/db";
import type { Purpose } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import {
  ApproachData,
  createApproachGroup,
  linkNewApproachGroupToActionByPurpose,
} from "@/core/approaches";
import {
  calculateStats,
  findInfoForCalculateStatsForApproach,
} from "@/core/stats";
import { IntegrationTrainingTimeScorer } from "@/integrations/trainingTime/scorer";

export async function handleUpdateApproachGroup(
  groupId: number,
  data: Array<ApproachData>,
  trainingId?: number,
) {
  const info = await findInfoForCalculateStatsForApproach(groupId);
  const stats = calculateStats(data, info.actionrig, info.userweight);
  await prisma.$transaction(async (tx) => {
    const approachesData = data.map((d) => Object.assign(d, { groupId }));
    await tx.approach.deleteMany({ where: { groupId } });
    await tx.approach.createMany({ data: approachesData });
    await tx.approachesGroup.update({
      where: { id: groupId },
      data: stats,
    });
  });
  if (trainingId) {
    new IntegrationTrainingTimeScorer().update(trainingId).then();
    revalidatePath(`/trainings/${trainingId}`);
  }
}

export async function handleCreateNewApproachesGroup(
  purpose: Purpose,
  purposeId: number,
  data: Array<ApproachData>,
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

  revalidatePath(`/actions/${actionId}/state`);
}
