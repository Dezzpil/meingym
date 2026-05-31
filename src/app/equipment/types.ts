import { z } from "zod";
import { ActionRequire, ActionRig } from ".prisma/client";

export const EquipmentRigField = z.object({
  type: z.nativeEnum(ActionRig),
  enabled: z.boolean(),
  minWeight: z.coerce.number().min(0).optional(),
  step: z.coerce.number().min(0).optional(),
  maxWeight: z.coerce.number().min(0).optional(),
});

export const EquipmentFormFields = z.object({
  name: z.string().min(1, "Название обязательно"),
  isDefault: z.boolean().default(false),
  requires: z.array(z.nativeEnum(ActionRequire)).default([]),
  rigs: z.array(EquipmentRigField).default([]),
});

export type EquipmentFormFieldsType = z.infer<typeof EquipmentFormFields>;

export const ACTION_RIG_VALUES: ActionRig[] = (
  Object.values(ActionRig) as ActionRig[]
).filter((v) => (v as string) !== "OTHER");

export const ACTION_REQUIRE_VALUES: ActionRequire[] = (
  Object.values(ActionRequire) as ActionRequire[]
).filter((v) => (v as string) !== "NONE");

export const ACTION_RIG_LABELS: Record<ActionRig, string> = {
  BLOCKS: "Блоки / тренажёр",
  BARBELL: "Штанга",
  DUMBBELL: "Гантели",
  KETTLEBELL: "Гиря",
  OTHER: "Свой вес", //фильтруется, не показывается
};

export const ACTION_REQUIRE_LABELS: Record<ActionRequire, string> = {
  UPBAR: "Турник / брусья",
  BENCH: "Скамья",
  SIMULATOR: "Тренажёр",
  NONE: "Без оборудования", // фильтруется, не показывается
};
