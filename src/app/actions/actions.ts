"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";

export async function handleUpdate(id: number, data: ActionsFormFieldsType) {
  const title = data.title;
  const muscleAgonyId = data.muscleAgonyId;
  const desc = data.desc;
  await prisma.actions.update({
    where: { id },
    data: { title, desc, muscleAgonyId },
  });
  revalidatePath(`/actions/${id}`);
}
export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title;
  const muscleAgonyId = data.muscleAgonyId;
  const desc = data.desc;

  const existed = await prisma.actions.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  } else {
    const action = await prisma.$transaction(async (tx) => {
      const action = await tx.actions.create({
        data: { title, muscleAgonyId, desc },
      });

      const approaches = [
        { weight: 20, countsPlanned: 12, priority: 0 },
        { weight: 30, countsPlanned: 12, priority: 1 },
        { weight: 40, countsPlanned: 12, priority: 2 },
      ];
      const count = approaches.length;
      let sum = 0,
        mean = 0;
      for (const a of approaches) {
        sum += a.weight * a.countsPlanned;
        mean += a.weight / a.countsPlanned;
      }
      mean = mean / count;

      const group = await tx.approachesGroups.create({
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

      await tx.actions.update({
        where: { id: action.id },
        data: { currentApproachGroupId: group.id },
      });

      return action;
    });

    revalidatePath(`/actions/${action.id}`);
    redirect(`/actions/${action.id}`);
  }
}
