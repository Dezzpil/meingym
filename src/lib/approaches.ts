import { PrismaTransactionClient } from "@/tools/types";
import type { ApproachesGroup } from "@prisma/client";

export type ApproachData = { weight: number; count: number; priority: number };

export type ApproachesStats = { count: number; sum: number; mean: number };

export const ApproachesStrengthDefault = [
  { weight: 40, count: 10, priority: 0 },
  { weight: 50, count: 8, priority: 1 },
  { weight: 60, count: 6, priority: 2 },
  { weight: 70, count: 3, priority: 3 },
  { weight: 80, count: 1, priority: 4 },
  { weight: 90, count: 1, priority: 5 },
];

export const ApproachesMassDefault = [
  { weight: 30, count: 15, priority: 0 },
  { weight: 30, count: 15, priority: 1 },
  { weight: 30, count: 15, priority: 2 },
];

export function calculateApproachesStats(
  approachesData: Array<ApproachData>,
): ApproachesStats {
  const count = approachesData.length;
  let sum = 0,
    mean = 0;
  for (const a of approachesData) {
    sum += a.weight * a.count;
    mean += a.weight / a.count;
  }
  mean = mean / count;
  return { count, sum, mean };
}

export async function createApproachGroup(
  tx: PrismaTransactionClient,
  approaches: ApproachData[],
): Promise<ApproachesGroup> {
  const given = approaches.length ? approaches : ApproachesStrengthDefault;
  const { count, sum, mean } = calculateApproachesStats(given);
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
    },
  });
}

export const MIN_BARBELL_WEIGHT = 1.25;
