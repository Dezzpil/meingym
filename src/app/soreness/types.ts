import { z } from "zod";
import { SorenessIntensity } from "@prisma/client";

export const SorenessEntrySchema = z.object({
  muscleId: z.number(),
  intensity: z.nativeEnum(SorenessIntensity),
});

export const SorenessFormFields = z.object({
  trainingId: z.number(),
  entries: z.array(SorenessEntrySchema).min(1),
});

export type SorenessFormFieldsType = z.infer<typeof SorenessFormFields>;
