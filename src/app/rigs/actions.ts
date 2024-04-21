"use server";

import { WeightsFields, WeightsFieldsType } from "@/app/rigs/types";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";

export async function handleWeightsUpdate(data: WeightsFieldsType) {
  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    for (const entry of Object.entries(data)) {
      await tx.rig.upsert({
        where: { code: entry[0] },
        update: {
          value: entry[1],
        },
        create: {
          code: entry[0],
          value: entry[1],
          userId,
          // @ts-ignore
          title: WeightsFields.shape[entry[0]].description,
        },
      });
    }
  });

  revalidatePath(`/weights`);
}
