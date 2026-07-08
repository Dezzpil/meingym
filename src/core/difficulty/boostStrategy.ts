import type { Approach, ApproachesGroup } from "@prisma/client";

export type TrainingExerciseWithApproaches = {
  id: number;
  approachGroupId: number;
  approachGroup: ApproachesGroup & { Approaches: Approach[] };
};

export interface TrainingDifficultyBoostStrategy {
  apply(exercises: TrainingExerciseWithApproaches[]): Promise<void>;
  revert(exercises: TrainingExerciseWithApproaches[]): Promise<void>;
}
