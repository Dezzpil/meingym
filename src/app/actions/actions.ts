"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";
import { ActionMass, ActionStrength, ApproachesGroup } from "@prisma/client";
import { PrismaTransactionClient } from "@/tools/types";
import {
  ApproachesMassDefault,
  ApproachesStrengthDefault,
  createApproachGroup,
} from "@/lib/approaches";

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
      withBlocks: data.withBlocks,
    },
  });
  revalidatePath(`/actions/${id}`);
}

type ActionRelated = {
  group: ApproachesGroup;
  purpose: ActionMass | ActionStrength;
};

async function createStr(tx: PrismaTransactionClient): Promise<ActionRelated> {
  const group = await createApproachGroup(tx, ApproachesStrengthDefault);
  const strength = await tx.actionStrength.create({
    data: {
      currentApproachGroupId: group.id,
    },
  });
  return { group, purpose: strength };
}

async function createMass(tx: PrismaTransactionClient): Promise<ActionRelated> {
  const group = await createApproachGroup(tx, ApproachesMassDefault);
  const strength = await tx.actionMass.create({
    data: {
      currentApproachGroupId: group.id,
    },
  });
  return { group, purpose: strength };
}

function autoDefineRig(title: string): { withBlocks: boolean } {
  const blocks = title.match(/тренаж|блок/iu);
  return { withBlocks: blocks ? blocks.length > 0 : false };
}

export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const { withBlocks } = autoDefineRig(data.title);

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
          withBlocks,
        },
      });
    });

    revalidatePath(`/actions/${action.id}`);
    redirect(`/actions/${action.id}`);
  }
}
