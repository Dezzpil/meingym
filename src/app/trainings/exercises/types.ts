import { z } from "zod";
import {
  Action,
  ApproachesGroup,
  Purpose,
  TrainingExerciseExecution,
  TrainingRating,
} from "@prisma/client";

export const ExerciseAddFields = z.object({
  actionId: z.number(),
  actionTitle: z.string().optional(),
  purpose: z.nativeEnum(Purpose),
});

export type ExerciseAddFieldsType = z.infer<typeof ExerciseAddFields>;

export type TrainingExerciseType = {
  id: number;
  trainingId: number;
  actionId: number;
  startedAt: Date | null;
  completedAt: Date | null;
  isPassed: boolean;
  rating: TrainingRating;
  comment: string | null;
  liftedSum: number;
  liftedMean: number;
  liftedMax: number;
  liftedCountTotal: number;
  liftedCountMean: number;
  purpose: Purpose;
} & {
  Action: Action;
  ApproachGroup: ApproachesGroup;
  TrainingExerciseExecution: TrainingExerciseExecution[];
};
