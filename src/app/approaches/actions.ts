"use server";

import { ApproachGroupPurpose, ApproachLiftData } from "@/app/approaches/types";
import { prisma } from "@/tools/db";
import { ActionMass, ActionStrength } from "@prisma/client";

export async function handleUpdateApproachesGroup(
  purpose: ApproachGroupPurpose,
  purposeId: number,
  data: Array<ApproachLiftData>,
) {
  let purposeItem: ActionMass | ActionStrength;
  switch (purpose) {
    case "mass": {
      purposeItem = await prisma.actionMass.findUniqueOrThrow({
        where: { id: purposeId },
      });
      break;
    }
    case "strength": {
      purposeItem = await prisma.actionStrength.findUniqueOrThrow({
        where: { id: purposeId },
      });
      break;
    }
  }

  const count = data.length;
  let sum = 0,
    mean = 0;
  for (const a of data) {
    sum += a.weight * a.count;
    mean += a.weight / a.count;
  }
  mean = mean / count;

  await prisma.$transaction(async (tx) => {
    const newGroup = await tx.approachesGroup.create({
      data: {
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
    switch (purpose) {
      case "mass": {
        await tx.actionMass.update({
          where: { id: purposeId },
          data: { currentApproachGroupId: newGroup.id },
        });
        break;
      }
      case "strength": {
        await tx.actionStrength.update({
          where: { id: purposeId },
          data: { currentApproachGroupId: newGroup.id },
        });
        break;
      }
    }
  });
}
