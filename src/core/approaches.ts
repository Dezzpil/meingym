import { PrismaTransactionClient } from "@/tools/types";
import type {
  ActionMass,
  ActionStrength,
  ApproachesGroup,
} from "@prisma/client";
import { CurrentPurpose, SetData, SetDataExecuted } from "@/core/types";
import {
  calculateStats,
  findInfoForCalculationStatsForAction,
} from "@/core/stats";
import { ActionRig } from "@prisma/client";

export type ApproachData = SetData & { priority: number };
export type ApproachExecutedData = SetDataExecuted & { priority: number };

export const ApproachesStrengthDefault: ApproachData[] = [
  { weight: 40, count: 10, priority: 0 },
  { weight: 50, count: 8, priority: 1 },
  { weight: 60, count: 6, priority: 2 },
  { weight: 70, count: 4, priority: 3 },
  { weight: 75, count: 2, priority: 4 },
  { weight: 80, count: 1, priority: 5 },
];

export const ApproachesMassDefault: ApproachData[] = [
  { weight: 35, count: 14, priority: 0 },
  { weight: 37.5, count: 12, priority: 1 },
  { weight: 40, count: 10, priority: 2 },
  { weight: 42.5, count: 8, priority: 3 },
];

export const ApproachesLossDefault: ApproachData[] = [
  { weight: 10, count: 8, priority: 0 },
  { weight: 10, count: 8, priority: 1 },
  { weight: 10, count: 8, priority: 2 },
  { weight: 10, count: 8, priority: 3 },
  { weight: 10, count: 8, priority: 4 },
];

export async function createApproachGroup(
  tx: PrismaTransactionClient,
  approaches: ApproachData[],
  actionId: number,
  userId: string,
): Promise<ApproachesGroup> {
  const info = await findInfoForCalculationStatsForAction(actionId, userId, tx);
  const given = approaches.length ? approaches : ApproachesStrengthDefault;
  const { len, weightSum, weightMean, weightMax, countSum, countMean } =
    calculateStats(given, info.actionrig, info.userweight);
  return tx.approachesGroup.create({
    data: {
      count: len,
      sum: weightSum,
      mean: weightMean,
      countTotal: countSum,
      countMean: countMean,
      max: weightMax,
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
  purpose: CurrentPurpose,
  actionByPurposeId: number,
  newGroup: ApproachesGroup,
) {
  switch (purpose) {
    case "MASS": {
      await tx.actionMass.update({
        where: { id: actionByPurposeId },
        data: { currentApproachGroupId: newGroup.id },
      });
      console.log(`ActionMass updated with approachGroup ${newGroup.id}`);
      break;
    }
    case "STRENGTH": {
      await tx.actionStrength.update({
        where: { id: actionByPurposeId },
        data: { currentApproachGroupId: newGroup.id },
      });
      console.log(`ActionStrength updated with approachGroup ${newGroup.id}`);
      break;
    }
    case "LOSS": {
      await tx.actionLoss.update({
        where: { id: actionByPurposeId },
        data: { currentApproachGroupId: newGroup.id },
      });
      console.log(`ActionLoss updated with approachGroup ${newGroup.id}`);
      break;
    }
  }
}

export async function createMassInitial(
  userId: string,
  actionId: number,
  actionRig: ActionRig,
  actionBigCount: boolean,
  tx: PrismaTransactionClient,
): Promise<ActionMass> {
  let i = 0;
  const defaults = [];
  for (const item of ApproachesMassDefault) {
    const copy: ApproachData = {
      count: item.count,
      weight: item.weight,
      priority: i++,
    };
    if (actionRig === ActionRig.OTHER) copy.weight = 0;
    if (actionBigCount) copy.count *= 2;
    defaults.push(copy);
  }
  const newGroup = await createApproachGroup(tx, defaults, actionId, userId);
  await tx.actionMass.deleteMany({ where: { userId, actionId } });
  return tx.actionMass.create({
    data: {
      actionId,
      userId,
      currentApproachGroupId: newGroup.id,
    },
  });
}

export async function createStrengthInitial(
  userId: string,
  actionId: number,
  actionStrAllowed: boolean,
  tx: PrismaTransactionClient,
): Promise<ActionStrength> {
  if (!actionStrAllowed)
    throw new Error(
      `Нельзя создать базовые силовые значения для движения, которое не подходит для силовых тренировок`,
    );
  const newGroup = await createApproachGroup(
    tx,
    ApproachesStrengthDefault,
    actionId,
    userId,
  );
  await tx.actionStrength.deleteMany({ where: { userId, actionId } });
  return tx.actionStrength.create({
    data: {
      actionId,
      userId,
      currentApproachGroupId: newGroup.id,
    },
  });
}

export async function createLossInitial(
  userId: string,
  actionId: number,
  actionRig: ActionRig,
  actionBigCount: boolean,
  tx: PrismaTransactionClient,
): Promise<ActionMass> {
  let i = 0;
  const defaults = [];
  for (const item of ApproachesLossDefault) {
    const copy: ApproachData = {
      count: item.count,
      weight: item.weight,
      priority: i++,
    };
    if (actionRig === ActionRig.OTHER) copy.weight = 0;
    if (actionBigCount) copy.count *= 2;
    defaults.push(copy);
  }
  const newGroup = await createApproachGroup(tx, defaults, actionId, userId);
  await tx.actionLoss.deleteMany({ where: { userId, actionId } });
  return tx.actionLoss.create({
    data: {
      actionId,
      userId,
      currentApproachGroupId: newGroup.id,
    },
  });
}
