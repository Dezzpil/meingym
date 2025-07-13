import { z } from "zod";
import { ActionRig } from "@prisma/client";
import type { Action, Muscle, MuscleGroup } from "@prisma/client";

export const ActionsFormFields = z.object({
  title: z.string().min(2),
  musclesAgonyIds: z.array(z.string()).nonempty(),
  musclesSynergyIds: z.array(z.string()),
  musclesStabilizerIds: z.array(z.string()),
  similarExerciseIds: z.array(z.string()),
  alias: z.string().nullable(),
  desc: z.string().min(2),
  rig: z.nativeEnum(ActionRig),
  strengthAllowed: z.boolean().default(false),
  bigCount: z.boolean().default(false),
  allowCheating: z.boolean().default(false),
  anotherTitles: z.string().min(2).nullable(),
});

export type ActionsFormFieldsType = z.infer<typeof ActionsFormFields>;
export type MuscleGroupType = Muscle & { Group: MuscleGroup };
export type ActionMusclesType = {
  muscleId: number;
  actionId: number;
  Muscle: MuscleGroupType;
};
export type SimilarExerciseType = {
  id: number;
  actionId: number;
  similarActionId: number;
  SimilarAction: Action;
};

export type ActionWithMusclesType = Action & {
  MusclesAgony: ActionMusclesType[];
  MusclesSynergy: ActionMusclesType[];
  MusclesStabilizer: ActionMusclesType[];
  SimilarTo?: SimilarExerciseType[];
  SimilarFrom?: SimilarExerciseType[];
};
