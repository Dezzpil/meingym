"use server";

import { ApproachLiftData } from "@/app/approaches/types";
import { prisma } from "@/tools/db";
import type { Purpose } from "@prisma/client";

function calculateStats(data: Array<ApproachLiftData>) {
  const count = data.length;
  let sum = 0,
    mean = 0;
  for (const a of data) {
    sum += a.weight * a.count;
    mean += a.weight / a.count;
  }
  mean = mean / count;
  return { count, sum, mean };
}

export async function handleUpdateApproachGroup(
  id: number,
  data: Array<ApproachLiftData>,
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
}

export async function handleCreateNewApproachesGroup(
  purpose: Purpose,
  purposeId: number,
  data: Array<ApproachLiftData>,
) {
  const stats = calculateStats(data);
  await prisma.$transaction(async (tx) => {
    const newGroup = await tx.approachesGroup.create({
      data: {
        count: stats.count,
        sum: stats.sum,
        mean: stats.mean,
        Approaches: {
          createMany: {
            data,
          },
        },
      },
    });
    switch (purpose) {
      case "MASS": {
        await tx.actionMass.update({
          where: { id: purposeId },
          data: { currentApproachGroupId: newGroup.id },
        });
        break;
      }
      case "STRENGTH": {
        await tx.actionStrength.update({
          where: { id: purposeId },
          data: { currentApproachGroupId: newGroup.id },
        });
        break;
      }
    }
  });
}
