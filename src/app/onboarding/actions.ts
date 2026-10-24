"use server";

import { z } from "zod";
import { TrainingExperience, TrainingProgression, Purpose, Sex } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import { createTrainingPeriod, getCurrentTrainingPeriod } from "@/core/periods";

const SetTrainingExperienceSchema = z.object({
  experience: z.nativeEnum(TrainingExperience),
});

export async function handleSetTrainingExperience(data: z.infer<typeof SetTrainingExperienceSchema>) {
  const userId = await getCurrentUserId();
  await prisma.userInfo.updateMany({
    where: { userId },
    data: { trainingExperience: data.experience },
  });
  revalidatePath("/onboarding");
}

const OnboardingProfileSchema = z.object({
  height: z.number().min(100).max(300),
  sex: z.nativeEnum(Sex),
  purpose: z.nativeEnum(Purpose),
});

export async function handleOnboardingProfileUpdate(data: z.infer<typeof OnboardingProfileSchema>) {
  const userId = await getCurrentUserId();
  await prisma.userInfo.updateMany({
    where: { userId },
    data: {
      height: data.height,
      sex: data.sex,
      purpose: data.purpose,
    },
  });
  revalidatePath("/onboarding");
}

const ProgressionParamsSchema = z.object({
  strengthWorkingSetsCount: z.number().min(1).max(4).optional(),
  strengthPrepareSetsCount: z.number().min(1).max(4).optional(),
  strengthWeightDelta: z.number().min(1.25).max(5).optional(),
  massSetsCount: z.number().min(1).max(10).optional(),
  massBigCountCoef: z.number().min(1).max(3).optional(),
  massWeightDelta: z.number().min(1.25).max(5).optional(),
  massAddDropSet: z.boolean().optional(),
  lossCountStep: z.number().min(1).max(5).optional(),
  lossCountMax: z.number().min(10).max(20).optional(),
  lossWeightDelta: z.number().min(1.25).max(5).optional(),
  lossMaxSets: z.number().min(3).max(8).optional(),
  durationSetsCount: z.number().min(1).max(10).optional(),
  durationStepSec: z.number().min(1).max(60).optional(),
  durationMaxSec: z.number().min(10).max(600).optional(),
  durationParamStep: z.number().min(0.1).max(10).optional(),
  durationMaxSets: z.number().min(1).max(10).optional(),
});

const OnboardingProgressionSchema = z.object({
  progression: z.nativeEnum(TrainingProgression),
  params: ProgressionParamsSchema.optional(),
});

export async function handleOnboardingProgressionSetup(data: z.infer<typeof OnboardingProgressionSchema>) {
  const userId = await getCurrentUserId();
  
  await prisma.userInfo.updateMany({
    where: { userId },
    data: {
      trainingProgression: data.progression,
      trainingProgressionParams: data.params ? JSON.stringify(data.params) : "{}",
    },
  });

  revalidatePath("/onboarding");
}

export async function handleCompleteOnboarding() {
  const userId = await getCurrentUserId();
  await prisma.userInfo.updateMany({
    where: { userId },
    data: { onboardingCompleted: true },
  });
  revalidatePath("/");
}

const OnboardingCreateTrainingSchema = z.object({
  plannedTo: z.date(),
  exerciseIds: z.array(z.number()).optional(),
});

export async function handleOnboardingCreateTraining(data: z.infer<typeof OnboardingCreateTrainingSchema>) {
  const userId = await getCurrentUserId();
  const userInfo = await prisma.userInfo.findFirstOrThrow({ where: { userId } });

  let currentPeriod = await getCurrentTrainingPeriod(userId);
  if (!currentPeriod) {
    currentPeriod = await createTrainingPeriod(userId);
  }

  const defaultEquipment = await prisma.equipment.findFirstOrThrow({
    where: { userId, isDefault: true },
  });

  const training = await prisma.training.create({
    data: {
      plannedTo: data.plannedTo,
      userId,
      periodId: currentPeriod.id,
      equipmentId: defaultEquipment.id,
      ...(userInfo.purpose === "LOSS" ? { isCircuit: true } : {}),
    },
  });

  try {
    // @ts-ignore - model may not be in generated types until prisma generate
    await prisma.trainingWarmUp.create({ data: { trainingId: training.id } });
  } catch (e) {
    // ignore if already exists (unique constraint)
  }

  await prisma.userInfo.updateMany({
    where: { userId },
    data: { onboardingCompleted: true },
  });

  revalidatePath("/");
  
  return { trainingId: training.id };
}
