"use server";

import { ApproachLiftData } from "@/app/approaches/types";
import { prisma } from "@/tools/db";

export async function handleUpdateApproachesGroup(
  groupId: number,
  data: Array<ApproachLiftData>,
) {
  const group = await prisma.approachesGroups.findUniqueOrThrow({
    where: { id: groupId },
  });
  const count = data.length;
  let sum = 0,
    mean = 0;
  for (const a of data) {
    sum += a.weight * a.count;
    mean += a.weight / a.count;
  }
  mean = mean / count;
  await prisma.$transaction(async (tx) => {
    const newGroup = await tx.approachesGroups.create({
      data: {
        actionId: group.actionId,
        count,
        sum,
        mean,
        Approaches: {
          createMany: {
            data,
          },
        },
      },
    });
    await tx.actions.update({
      where: { id: group.actionId },
      data: {
        currentApproachGroupId: newGroup.id,
      },
    });
  });
}
