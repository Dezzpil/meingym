import { PrismaTransactionClient } from "@/tools/types";
import type { ApproachesGroup } from "@prisma/client";
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
    },
  });
}
