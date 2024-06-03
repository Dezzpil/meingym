"use server";

import { ProfileFormFieldsType } from "@/app/profile/types";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";

export async function handleProfileUpdate(data: ProfileFormFieldsType) {
  const userId = await getCurrentUserId();
  await prisma.userInfo.updateMany({
    where: { userId },
    data: {
      sex: data.sex,
      height: data.height,
      purpose: data.purpose,
      trainingProgression: data.trainingProgression,
      trainingProgressionParams: JSON.stringify(data.trainingProgressionParams),
    },
  });
  // return { ok: true, error: null };

  revalidatePath(`/profile`);
}
