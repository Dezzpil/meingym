import { z } from "zod";

export const MusclesGroupsFormFields = z.object({
  title: z.string().min(2),
});

export type MusclesGroupsFormFieldsType = z.infer<
  typeof MusclesGroupsFormFields
>;
