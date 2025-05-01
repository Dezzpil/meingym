"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import { getCurrentDayBorders } from "@/tools/dates";
import { redirect } from "next/navigation";

const WeightField = z.object({
  value: z.number(),
});

export type WeightType = z.infer<typeof WeightField>;

export async function handleWeightSave(data: WeightType) {
  const userId = await getCurrentUserId();
  await prisma.weight.create({ data: { value: data.value, userId } });
  redirect(`/`);
}

export async function handleWeightDelete() {
  const userId = await getCurrentUserId();
  const { gte, lt } = getCurrentDayBorders();
  await prisma.weight.deleteMany({ where: { userId, createdAt: { gte, lt } } });
  redirect(`/`);
}
