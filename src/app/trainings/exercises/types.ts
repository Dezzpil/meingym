import { z } from "zod";
import { Purpose } from "@prisma/client";

export const ExerciseAddFields = z.object({
  actionId: z.number(),
  purpose: z.nativeEnum(Purpose),
});

export type ExerciseAddFieldsType = z.infer<typeof ExerciseAddFields>;
