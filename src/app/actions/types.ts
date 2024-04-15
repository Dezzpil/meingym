import { z } from "zod";
import { ActionRig } from "@prisma/client";

export const ActionsFormFields = z.object({
  title: z.string().min(2),
  musclesAgonyIds: z.array(z.string()).nonempty(),
  musclesSynergyIds: z.array(z.string()),
  alias: z.string().nullable(),
  desc: z.string().min(2),
  rig: z.nativeEnum(ActionRig),
});

export type ActionsFormFieldsType = z.infer<typeof ActionsFormFields>;
