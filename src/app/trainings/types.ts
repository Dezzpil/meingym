import { z } from "zod";

export const TrainingFormFields = z.object({
  plannedTo: z.date(),
});

export type TrainingFormFieldsType = z.infer<typeof TrainingFormFields>;
