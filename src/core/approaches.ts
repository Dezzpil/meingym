import { PrismaTransactionClient } from "@/tools/types";
import type { ApproachesGroup, Purpose } from "@prisma/client";
import { SetData } from "@/core/types";
import {
  calculateStats,
  findInfoForCalculationStatsForAction,
} from "@/core/stats";

export type ApproachData = SetData & { priority: number };

export const ApproachesStrengthDefault: ApproachData[] = [
  { weight: 40, count: 12, priority: 0 },
  { weight: 50, count: 6, priority: 1 },
  { weight: 60, count: 3, priority: 2 },
  { weight: 70, count: 2, priority: 3 },
  { weight: 75, count: 1, priority: 4 },
  { weight: 80, count: 1, priority: 5 },
];

export const ApproachesMassDefault: ApproachData[] = [
  { weight: 30, count: 14, priority: 0 },
  { weight: 35, count: 12, priority: 1 },
  { weight: 35, count: 10, priority: 2 },
  { weight: 35, count: 8, priority: 3 },
];

// Значения по умолчанию для движений с собственным весом
export const ApproachesMassBodyDefault: ApproachData[] = [
  { weight: 0, count: 15, priority: 0 },
  { weight: 0, count: 15, priority: 1 },
  { weight: 0, count: 15, priority: 2 },
  { weight: 0, count: 15, priority: 2 },
];

export async function createApproachGroup(
  tx: PrismaTransactionClient,
  approaches: ApproachData[],
  actionId: number,
  userId: string,
): Promise<ApproachesGroup> {
  const info = await findInfoForCalculationStatsForAction(actionId, userId, tx);
  const given = approaches.length ? approaches : ApproachesStrengthDefault;
  const { count, sum, mean } = calculateStats(
    given,
    info.actionrig,
    info.userweight,
  );
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
