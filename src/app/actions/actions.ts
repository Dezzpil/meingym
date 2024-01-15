"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";
import { ActionMass, ActionStrength, ApproachesGroup } from "@prisma/client";
import { PrismaTransactionClient } from "@/tools/types";

export async function handleUpdate(id: number, data: ActionsFormFieldsType) {
  const title = data.title;
  await prisma.action.update({
    where: { id },
    data: {
      title,
      desc: data.desc,
      alias: data.alias,
      MusclesAgony: {
        deleteMany: { actionId: id },
        createMany: {
          data: data.musclesAgonyIds.map((id) => {
            return { muscleId: parseInt(id) };
          }),
        },
      },
      MusclesSynergy: {
        deleteMany: { actionId: id },
        createMany: {
          data: data.musclesSynergyIds.map((id) => {
            return { muscleId: parseInt(id) };
          }),
        },
      },
    },
  });
  revalidatePath(`/actions/${id}`);
}

type ApproachData = { weight: number; count: number; priority: number };
type ApproachesStats = { count: number; sum: number; mean: number };

function calculateStats(approachesData: Array<ApproachData>): ApproachesStats {
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

type ActionRelated = {
  group: ApproachesGroup;
  purpose: ActionMass | ActionStrength;
};

async function createStr(tx: PrismaTransactionClient): Promise<ActionRelated> {
  const approaches = [
    { weight: 40, count: 10, priority: 0 },
    { weight: 50, count: 8, priority: 1 },
    { weight: 60, count: 6, priority: 2 },
    { weight: 70, count: 3, priority: 3 },
    { weight: 80, count: 1, priority: 4 },
    { weight: 90, count: 1, priority: 5 },
  ];
  const { count, sum, mean } = calculateStats(approaches);
  const group = await tx.approachesGroup.create({
    data: {
      count,
      sum,
      mean,
      Approaches: {
        createMany: {
          data: approaches,
        },
      },
    },
  });
  const strength = await tx.actionStrength.create({
    data: {
      currentApproachGroupId: group.id,
    },
  });
  return { group, purpose: strength };
}

async function createMass(tx: PrismaTransactionClient): Promise<ActionRelated> {
  const approaches = [
    { weight: 30, count: 15, priority: 0 },
    { weight: 30, count: 15, priority: 1 },
    { weight: 30, count: 15, priority: 2 },
  ];
  const { count, sum, mean } = calculateStats(approaches);
  const group = await tx.approachesGroup.create({
    data: {
      count,
      sum,
      mean,
      Approaches: {
        createMany: {
          data: approaches,
        },
      },
    },
  });
  const strength = await tx.actionMass.create({
    data: {
      currentApproachGroupId: group.id,
    },
  });
  return { group, purpose: strength };
}

export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const existed = await prisma.action.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  } else {
    const action = await prisma.$transaction(async (tx) => {
      const mass = await createMass(tx);
      const strength = await createStr(tx);
      return tx.action.create({
        data: {
          title,
          desc: data.desc,
          massId: mass.purpose.id,
          strengthId: strength.purpose.id,
          MusclesAgony: {
            createMany: {
              data: data.musclesAgonyIds.map((id) => {
                return { muscleId: parseInt(id) };
              }),
            },
          },
          MusclesSynergy: {
            createMany: {
              data: data.musclesSynergyIds.map((id) => {
                return { muscleId: parseInt(id) };
              }),
            },
          },
        },
      });
    });

    revalidatePath(`/actions/${action.id}`);
    redirect(`/actions/${action.id}`);
  }
}
