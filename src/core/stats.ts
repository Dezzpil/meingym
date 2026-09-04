import { SetData, SetsStats } from "@/core/types";
import { ActionRig } from "@prisma/client";
import { prisma } from "@/tools/db";
import { PrismaTransactionClient } from "@/tools/types";

export function getRawQueryForApproachGroup(groupId: number): string {
  return `SELECT W.value userWeight, A.rig actionRig, A."isDurationBased" as "isDurationBased"
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
  isDurationBased: boolean;
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
  // для упражнений «на длительность» вес тела не участвует в расчёте статистики
  if (action.rig === ActionRig.OTHER && !action.isDurationBased) {
    const weight = await tx.weight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (!weight) throw new Error(`не найдено ни одной записи веса`);
    userweight = weight.value;
  }

  return {
    actionrig: action.rig,
    userweight,
    isDurationBased: action.isDurationBased,
  };
}

export function calculateStats(
  setsData: Array<SetData>,
  actionRig: ActionRig,
  userWeight: number,
  isDurationBased = false,
): SetsStats {
  const count = setsData.length;
  let sum = 0,
    mean = 0,
    countTotal = 0,
    countMean = 0,
    maxWeight = 0;
  for (const set of setsData) {
    if (isDurationBased) {
      // длительность: count = секунды, weight = параметр сложности (0 если параметра нет);
      // вес тела не прибавляем, накапливаем при наличии секунд
      const param = set.weight;
      if (set.count > 0) {
        countTotal += set.count;
        sum += param * set.count;
        mean += param;
        maxWeight = Math.max(maxWeight, param);
      }
      continue;
    }
    const weight =
      actionRig === ActionRig.OTHER ? userWeight + set.weight : set.weight;
    if (weight * set.count > 0) {
      countTotal += set.count;
      sum += weight * set.count;
      mean += weight;
      maxWeight = Math.max(maxWeight, weight);
    }
  }
  mean = count ? mean / count : 0;
  countMean = count ? countTotal / count : 0;
  return {
    len: count,
    weightSum: sum,
    weightMean: mean,
    weightMax: maxWeight,
    countSum: countTotal,
    countMean,
  };
}
