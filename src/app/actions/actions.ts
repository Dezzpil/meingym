"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";

export async function handleUpdate(id: number, data: ActionsFormFieldsType) {
  console.log(data);
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
export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const existed = await prisma.action.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  } else {
    const action = await prisma.$transaction(async (tx) => {
      const action = await tx.action.create({
        data: {
          title,
          desc: data.desc,
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

      const approaches = [
        { weight: 20, count: 12, priority: 0 },
        { weight: 30, count: 12, priority: 1 },
        { weight: 40, count: 12, priority: 2 },
      ];
      const count = approaches.length;
      let sum = 0,
        mean = 0;
      for (const a of approaches) {
        sum += a.weight * a.count;
        mean += a.weight / a.count;
      }
      mean = mean / count;

      const group = await tx.approachesGroup.create({
        data: {
          actionId: action.id,
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

      await tx.action.update({
        where: { id: action.id },
        data: { currentApproachGroupId: group.id },
      });

      return action;
    });

    revalidatePath(`/actions/${action.id}`);
    redirect(`/actions/${action.id}`);
  }
}
