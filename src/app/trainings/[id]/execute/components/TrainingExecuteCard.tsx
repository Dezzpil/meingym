"use client";

import React, { useCallback } from "react";
import {
  handleTrainingExercisePass,
  handleTrainingExerciseStart,
} from "@/app/trainings/[id]/execute/actions";
import type {
  TrainingExercise,
  Action,
  TrainingExerciseExecution,
  ApproachesGroup,
} from "@prisma/client";
import { TrainingExecuteForm } from "@/app/trainings/[id]/execute/components/TrainingExecuteForm";
import { PurposeText } from "@/components/PurposeText";
import classNames from "classnames";

type Props = {
  exercise: TrainingExercise & {
    Action: Action;
    ApproachGroup: ApproachesGroup;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
};
export function TrainingExecuteCard({ exercise, disabled }: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exercise.id, exercise.trainingId);
  }, [exercise]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exercise.id, exercise.trainingId);
  }, [exercise]);

  return (
    <div className="card mb-3" key={exercise.id}>
      <div className="card-header">
        <ul className="col-lg-6 col-md-12 list-inline mb-0">
          <li
            className={classNames("list-inline-item", {
              "fw-medium": exercise.startedAt && !exercise.completedAt,
            })}
          >
            {exercise.Action.alias
              ? exercise.Action.alias
              : exercise.Action.title}
          </li>
          <li className="list-inline-item">
            <PurposeText purpose={exercise.purpose} />
          </li>
        </ul>
        <div className="col-lg-6 col-md-12"></div>
      </div>
      <div className="card-body">
        {!disabled && !exercise.startedAt && (
          <div className="d-flex justify-content-between mb-2">
            <button className="btn btn-outline-warning" onClick={pass}>
              Пропустить
            </button>
            <button className="btn btn-primary" onClick={start}>
              Погнали!
            </button>
          </div>
        )}
        <TrainingExecuteForm
          exercise={exercise}
          disabled={!exercise.startedAt || !!exercise.completedAt || disabled}
        />
      </div>
    </div>
  );
}
