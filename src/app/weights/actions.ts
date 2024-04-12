"use server";

import { WeightsFields, WeightsFieldsType } from "@/app/weights/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/tools/auth";
import { prisma } from "@/tools/db";

export async function handleWeightsUpdate(data: WeightsFieldsType) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error(`no session found, refresh the page`);

  // @ts-ignore
  const userId = session?.user.id;

  await prisma.$transaction(async (tx) => {
    for (const entry of Object.entries(data)) {
      await tx.weights.upsert({
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
