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
import { TrainingExecuteForm } from "@/app/trainings/[id]/execute/form";
import { GrRun } from "react-icons/gr";
import classNames from "classnames";
import { FaSpinner } from "react-icons/fa6";
type Props = {
  exec: TrainingExercise & {
    Action: Action;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
};
export function TrainingExecuteCard({ exec, disabled }: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exec.id, exec.trainingId);
  }, [exec]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exec.id, exec.trainingId);
  }, [exec]);

  return (
    <div className={classNames("card mb-3")} key={exec.id}>
      <div
        className={classNames("card-header d-flex align-items-center gap-3")}
      >
        <span>{exec.Action.alias ? exec.Action.alias : exec.Action.title}</span>
        {exec.startedAt && !exec.completedAt && <FaSpinner />}
        {!exec.startedAt && (
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
            >
              Пропустить...
            </button>
          </div>
        )}
        {exec.isPassed && <GrRun title="Упражнение было пропущено" />}
      </div>
      <div className="card-body">
        <TrainingExecuteForm
          exercise={exec}
          disabled={!exec.startedAt || !!exec.completedAt || disabled}
        />
      </div>
    </div>
  );
}
