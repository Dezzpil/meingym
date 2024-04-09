import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import type {
  TrainingExercise,
  Action,
  ApproachesGroup,
  Approach,
  TrainingExerciseExecution,
  Training,
} from "@prisma/client";
import React from "react";
import { TrainingExecutePanel } from "@/app/trainings/[id]/execute/panel";
import { TrainingExecuteCard } from "@/app/trainings/[id]/execute/card";
import { TrainingExecuteComplete } from "@/app/trainings/[id]/execute/complete";

type TrainingExerciseType = TrainingExercise & {
  Action: Action;
  ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  TrainingExerciseExecution: TrainingExerciseExecution[];
};
type TrainingType = Training & { TrainingExercise: TrainingExerciseType[] };

async function findTraining(id: number): Promise<TrainingType> {
  // @ts-ignore
  return prisma.training.findUniqueOrThrow({
    where: { id },
    include: {
      TrainingExercise: {
        include: {
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

export default async function TrainingExecutePage({ params }: ItemPageParams) {
  const id = parseInt(params.id);

  let training = await findTraining(id);
  if (await createExecutions(training)) {
    training = await findTraining(id);
  }

  return (
    <div>
      <TrainingExecutePanel training={training} />
      {training.TrainingExercise.map((e: TrainingExerciseType) => (
        <TrainingExecuteCard
          exec={e}
          key={e.id}
          disabled={!training.startedAt || !!training.completedAt}
        />
      ))}
      {training.startedAt && <TrainingExecuteComplete training={training} />}
    </div>
  );
}
