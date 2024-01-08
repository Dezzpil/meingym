import { z } from "zod";

export const MusclesFormFields = z.object({
  title: z.string().min(2),
  groupId: z.number(),
});

export type MusclesFormFieldsType = z.infer<typeof MusclesFormFields>;
