import { z } from "zod";

export const TrainingDateFormField = z.object({
  plannedTo: z.date(),
});

export type TrainingDateFormFieldType = z.infer<typeof TrainingDateFormField>;

export const TrainingRepeatDateFormFields = z.object({
  plannedTo: z.date(),
  fromId: z.number(),
});

export type TrainingRepeatDateFormFieldsType = z.infer<
  typeof TrainingRepeatDateFormFields
>;

export const TrainingFormFields = z.object({
  commonComment: z.string().nullish(),
  isCircuit: z.boolean(),
  plannedTo: z.date(),
});

export type TrainingFormFieldsType = z.infer<typeof TrainingFormFields>;
