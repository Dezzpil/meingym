import { z } from "zod";

export const ActionsFormFields = z.object({
  title: z.string().min(2),
  desc: z.string().min(2),
  muscleAgonyId: z.number(),
});

export type ActionsFormFieldsType = z.infer<typeof ActionsFormFields>;
