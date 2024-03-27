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
import ExerciseExecutionItem from "@/components/trainings/ExerciseExecutionItem";

type TrainingExerciseType = TrainingExercise & {
  Action: Action;
  ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  TrainingExerciseExecution: TrainingExerciseExecution[];
};
type TrainingType = Training & { TrainingExercise: TrainingExerciseType[] };

async function findTraining(id: number): Promise<TrainingType> {
  return prisma.training.findUniqueOrThrow({
    where: { id },
    include: {
      TrainingExercise: {
        include: {
          Action: true,
          ApproachGroup: {
            include: { Approaches: true },
          },
          TrainingExerciseExecution: true,
        },
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
      {training.TrainingExercise.map((e: TrainingExerciseType) => (
        <div className="card mb-3" key={e.id}>
          <div className="card-header">
            {e.Action.alias ? e.Action.alias : e.Action.title}
          </div>
          <div className="card-body">
            <div className="row mb-2">
              {e.TrainingExerciseExecution.map((exec) => (
                <ExerciseExecutionItem key={exec.id} exec={exec} />
              ))}
            </div>
            <div className="d-flex justify-content-between">
              <button>Еще подход!</button>
              <button>Закончили</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
