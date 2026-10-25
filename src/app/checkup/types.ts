import { z } from "zod";
import { DifficultyChoice } from "@prisma/client";

export const CheckupFormFields = z.object({
  trainingId: z.number(),
  sleep: z.number().min(1).max(5),
  nutrition: z.number().min(1).max(5),
  preWorkout: z.number().min(1).max(5),
  stress: z.number().min(1).max(5),
  burnoutExhaustion: z.number().min(1).max(5).nullable().optional(),
  burnoutDistance: z.number().min(1).max(5).nullable().optional(),
  burnoutCognitive: z.number().min(1).max(5).nullable().optional(),
  burnoutEmotional: z.number().min(1).max(5).nullable().optional(),
  difficultyChoice: z.nativeEnum(DifficultyChoice).nullable().optional(),
});

export type CheckupFormFieldsType = z.infer<typeof CheckupFormFields>;
