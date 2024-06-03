import { SetData, SetsStats } from "@/core/types";
import { ActionRig } from "@prisma/client";
import { prisma } from "@/tools/db";
import { PrismaTransactionClient } from "@/tools/types";

export function getRawQueryForApproachGroup(groupId: number): string {
  return `SELECT W.value userWeight, A.rig actionRig
    FROM "ApproachesGroup" AG
    LEFT JOIN "Action" A ON AG."actionId" = A.id
    LEFT JOIN "Weight" W ON AG."userId" = W."userId"
    WHERE AG.id = ${groupId}
    ORDER BY W."createdAt" DESC
    LIMIT 1`;
}

export type InfoForCalculatingStats = {
  userweight: number;
  actionrig: ActionRig;
};

export async function findInfoForCalculateStatsForApproach(
  approachGroupId: number,
): Promise<InfoForCalculatingStats> {
  const query = getRawQueryForApproachGroup(approachGroupId);
  const result = (await prisma.$queryRawUnsafe(
    query,
  )) as InfoForCalculatingStats[];
  return result[0];
}

export async function findInfoForCalculationStatsForAction(
  actionId: number,
  userId: string,
  tx: PrismaTransactionClient,
): Promise<InfoForCalculatingStats> {
  const action = await tx.action.findUniqueOrThrow({ where: { id: actionId } });
  let userweight = 0;
  if (action.rig === ActionRig.OTHER) {
    const weight = await tx.weight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (!weight) throw new Error(`не найдено ни одной записи веса`);
    userweight = weight.value;
  }

  return { actionrig: action.rig, userweight };
}

export function calculateStats(
  setsData: Array<SetData>,
  actionRig: ActionRig,
  userWeight: number,
): SetsStats {
  const count = setsData.length;
  let sum = 0,
    mean = 0,
    countTotal = 0;
  for (const set of setsData) {
    const weight =
      actionRig === ActionRig.OTHER ? userWeight + set.weight : set.weight;
    if (weight * set.count > 0) {
      countTotal += set.count;
      sum += weight * set.count;
      mean += weight;
    }
  }
  mean = mean / count;
  return { count, sum, mean, countTotal };
}
