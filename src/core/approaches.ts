import { PrismaTransactionClient } from "@/tools/types";
import type { ApproachesGroup, Purpose } from "@prisma/client";
import { SetData } from "@/core/types";
import { calculateStats } from "@/core/stats";

export type ApproachData = SetData & { priority: number };

export const ApproachesStrengthDefault: ApproachData[] = [
  { weight: 40, count: 10, priority: 0 },
  { weight: 50, count: 8, priority: 1 },
  { weight: 60, count: 6, priority: 2 },
  { weight: 70, count: 3, priority: 3 },
  { weight: 80, count: 1, priority: 4 },
  { weight: 90, count: 1, priority: 5 },
];

export const ApproachesMassDefault: ApproachData[] = [
  { weight: 30, count: 15, priority: 0 },
  { weight: 30, count: 15, priority: 1 },
  { weight: 30, count: 15, priority: 2 },
];

export async function createApproachGroup(
  tx: PrismaTransactionClient,
  approaches: ApproachData[],
  actionId: number,
  userId: string,
): Promise<ApproachesGroup> {
  const given = approaches.length ? approaches : ApproachesStrengthDefault;
  const { count, sum, mean } = calculateStats(given);
  return tx.approachesGroup.create({
    data: {
      count,
      sum,
      mean,
      Approaches: {
        createMany: {
          data: given,
        },
      },
      actionId,
      userId,
    },
  });
}

export async function linkNewApproachGroupToActionByPurpose(
  tx: PrismaTransactionClient,
  purpose: Purpose,
  purposeId: number,
  newGroup: ApproachesGroup,
) {
  switch (purpose) {
    case "MASS": {
      await tx.actionMass.update({
        where: { id: purposeId },
        data: { currentApproachGroupId: newGroup.id },
      });
      console.log(`actionMass updated with approachGroup ${newGroup.id}`);
      break;
    }
    case "STRENGTH": {
      await tx.actionStrength.update({
        where: { id: purposeId },
        data: { currentApproachGroupId: newGroup.id },
      });
      console.log(`actionStrength updated with approachGroup ${newGroup.id}`);
      break;
    }
  }
}
