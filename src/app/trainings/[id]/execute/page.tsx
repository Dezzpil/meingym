import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import {
  TrainingExercise,
  Action,
  ApproachesGroup,
  Approach,
  TrainingExerciseExecution,
  Training,
  TrainingRating,
  Purpose,
  TrainingWarmUp,
} from "@prisma/client";
import React from "react";
import { TrainingExecuteTopPanel } from "@/app/trainings/[id]/execute/components/TrainingExecuteTopPanel";
import { TrainingExecuteCard } from "@/app/trainings/[id]/execute/components/TrainingExecuteCard";
import { TrainingExecuteCompletePanel } from "@/app/trainings/[id]/execute/components/TrainingExecuteCompletePanel";
import { ActionWithMusclesType } from "@/app/actions/types";
import { TrainingWarmUpCard } from "@/app/trainings/[id]/execute/components/TrainingWarmUpCard";

type TrainingExerciseType = TrainingExercise & {
  Action: Action;
  ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  TrainingExerciseExecution: TrainingExerciseExecution[];
};

type TrainingType = Training & {
  TrainingExercise: TrainingExerciseType[];
  WarmUp: TrainingWarmUp;
};

async function findTraining(id: number): Promise<TrainingType> {
  // @ts-ignore
  return prisma.training.findUniqueOrThrow({
    where: { id },
    include: {
      // @ts-ignore
      WarmUp: true,
      TrainingExercise: {
        select: {
          id: true,
          trainingId: true,
          actionId: true,
          startedAt: true,
          completedAt: true,
          isPassed: true,
          rating: true,
          comment: true,
          liftedSum: true,
          liftedMean: true,
          liftedMax: true,
          liftedCountTotal: true,
          liftedCountMean: true,
          purpose: true,
          Action: true,
          ApproachGroup: {
            include: { Approaches: true },
          },
          // @ts-ignore
          TrainingExerciseExecution: { orderBy: { priority: "asc" } },
        },
        orderBy: { priority: "asc" },
      },
    },
  });
}
async function createExecutions(training: TrainingType): Promise<boolean> {
  const data = [];
  for (const e of training.TrainingExercise) {
    if (e.TrainingExerciseExecution.length === 0) {
      for (const a of e.ApproachGroup.Approaches) {
        data.push({
          exerciseId: e.id,
          approachId: a.id,
          plannedCount: a.count,
          plannedWeigth: a.weight,
          liftedCount: 0,
          liftedWeight: 0,
          priority: a.priority,
        });
      }
    }
  }

  if (data.length) {
    await prisma.trainingExerciseExecution.createMany({ data });
    return true;
  }
  return false;
}

async function fetchAllActions(): Promise<ActionWithMusclesType[]> {
  return prisma.action.findMany({
    include: {
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
    },
  }) as Promise<ActionWithMusclesType[]>;
}

export default async function TrainingExecutePage({ params }: ItemPageParams) {
  const id = parseInt(params.id);

  let training = await findTraining(id);
  if (await createExecutions(training)) {
    training = await findTraining(id);
  }

  // Fetch all available actions for exercise replacement
  const allActions = await fetchAllActions();

  const warmUpDone = !!(
    training.WarmUp &&
    (training.WarmUp.isSkipped || training.WarmUp.completedAt)
  );
  const globalDisabled = !training.startedAt || !!training.completedAt;

  return (
    <div>
      <TrainingExecuteTopPanel training={training} />
      {training.WarmUp && (
        <TrainingWarmUpCard
          warmUp={training.WarmUp}
          disabled={globalDisabled}
        />
      )}
      {training.TrainingExercise.map((e: TrainingExerciseType) => (
        <TrainingExecuteCard
          exercise={e}
          key={e.id}
          disabled={globalDisabled || !warmUpDone}
          allActions={allActions}
          allExercises={training.TrainingExercise}
        />
      ))}
      {training.startedAt && (
        <TrainingExecuteCompletePanel training={training} />
      )}
    </div>
  );
}
