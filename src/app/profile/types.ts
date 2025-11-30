import { z } from "zod";
import { Purpose, Sex, TrainingProgression } from "@prisma/client";

export const ProfileFormFields = z.object({
  height: z.number().min(100).max(300),
  sex: z.nativeEnum(Sex),
  purpose: z.nativeEnum(Purpose),
  trainingProgression: z.nativeEnum(TrainingProgression),
  trainingProgressionParams: z.any(),
  collectExerciseExecutionFeedback: z.boolean().default(false),
});

export type ProfileFormFieldsType = z.infer<typeof ProfileFormFields>;
