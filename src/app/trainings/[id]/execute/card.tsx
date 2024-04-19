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
} from "@prisma/client";
import { TrainingExerciseExecuteForm } from "@/app/trainings/[id]/execute/form";
import { GrRun } from "react-icons/gr";
import classNames from "classnames";
import { FaSpinner } from "react-icons/fa6";
type Props = {
  exercise: TrainingExercise & {
    Action: Action;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
};
export function TrainingExerciseCard({ exercise, disabled }: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exercise.id, exercise.trainingId);
  }, [exercise]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exercise.id, exercise.trainingId);
  }, [exercise]);

  return (
    <div className={classNames("card mb-3")} key={exercise.id}>
      <div
        className={classNames("card-header d-flex align-items-center gap-3")}
      >
        <span>
          {exercise.Action.alias
            ? exercise.Action.alias
            : exercise.Action.title}
        </span>
        {exercise.startedAt && !exercise.completedAt && <FaSpinner />}
        {!exercise.startedAt && (
          <div className="d-flex gap-3">
            <button
              disabled={disabled}
              className="btn btn-primary"
              onClick={start}
            >
              Погнали!
            </button>
            <button
              disabled={disabled}
              className="btn btn-warning"
              onClick={pass}
              title="Пропустить"
            >
              <GrRun />
            </button>
          </div>
        )}
        {exercise.isPassed && <GrRun title="Упражнение было пропущено" />}
      </div>
      <div className="card-body">
        <TrainingExerciseExecuteForm
          exercise={exercise}
          disabled={!exercise.startedAt || !!exercise.completedAt || disabled}
        />
      </div>
    </div>
  );
}
