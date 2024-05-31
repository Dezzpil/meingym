"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";
import { ActionRig } from "@prisma/client";

export async function handleUpdate(id: number, data: ActionsFormFieldsType) {
  const title = data.title;
  await prisma.action.update({
    where: { id },
    data: {
      title,
      desc: data.desc,
      alias: data.alias,
      strengthAllowed: data.strengthAllowed,
      bigCount: data.bigCount,
      allowCheating: data.allowCheating,
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
      MusclesStabilizer: {
        deleteMany: { actionId: id },
        createMany: {
          data: data.musclesStabilizerIds.map((id) => {
            return { muscleId: parseInt(id) };
          }),
        },
      },
      rig: data.rig,
      updatedAt: new Date(),
    },
  });
  revalidatePath(`/actions/${id}`);
}

function autoDefineRig(title: string, def: ActionRig): ActionRig {
  const blocks = title.match(/тренаж|блок/iu);
  if (blocks && blocks.length > 0) return ActionRig.BLOCKS;

  const barbell = title.match(/штанг|жим/iu);
  if (barbell && barbell.length > 0) return ActionRig.BARBELL;

  const dumbbell = title.match(/гантел/iu);
  if (dumbbell && dumbbell.length > 0) return ActionRig.DUMBBELL;

  return def;
}

export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const rig = autoDefineRig(data.title, data.rig);

  const existed = await prisma.action.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  } else {
    const action = await prisma.$transaction(async (tx) => {
      const action = await tx.action.create({
        data: {
          title,
          rig,
          desc: data.desc,
          strengthAllowed: data.strengthAllowed,
          bigCount: data.bigCount,
          allowCheating: data.allowCheating,
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
          MusclesStabilizer: {
            createMany: {
              data: data.musclesStabilizerIds.map((id) => {
                return { muscleId: parseInt(id) };
              }),
            },
          },
        },
      });
      return action;
    });

    redirect(`/actions/${action.id}`);
  }
}
