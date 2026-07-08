import { z } from "zod";

export const MusclesFormFields = z.object({
  title: z.string().min(2),
  titleEn: z.string().min(2).optional(),
  groupId: z.number(),
  priorityRank: z.number().int().min(1).max(3).default(1),
  sizeFactor: z.number().min(0).max(1).default(0.5),
});

export type MusclesFormFieldsType = z.infer<typeof MusclesFormFields>;
