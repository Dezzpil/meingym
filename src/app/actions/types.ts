import { z } from "zod";

export const ActionsFormFields = z.object({
  title: z.string().min(2),
  musclesAgonyIds: z.array(z.string()).nonempty(),
  musclesSynergyIds: z.array(z.string()),
  alias: z.string().nullable(),
  desc: z.string().min(2),
  withBlocks: z.boolean(),
});

export type ActionsFormFieldsType = z.infer<typeof ActionsFormFields>;
