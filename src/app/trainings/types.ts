import { z } from "zod";

export const TrainingFormFields = z.object({
  plannedTo: z.date(),
});

export type TrainingFormFieldsType = z.infer<typeof TrainingFormFields>;

export const TrainingRepeatFormFields = z.object({
  plannedTo: z.date(),
  fromId: z.number(),
});

export type TrainingRepeatFormFieldsType = z.infer<
  typeof TrainingRepeatFormFields
>;
