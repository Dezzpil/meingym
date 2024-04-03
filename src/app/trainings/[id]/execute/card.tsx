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
type Props = {
  exec: TrainingExercise & {
    Action: Action;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
};
export function TrainingExecuteCard({ exec }: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exec.id, exec.trainingId);
  }, [exec]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exec.id, exec.trainingId);
  }, [exec]);

  return (
    <div className="card mb-3" key={exec.id}>
      <div className="card-header d-flex align-items-center gap-3">
        <span>{exec.Action.alias ? exec.Action.alias : exec.Action.title}</span>
        {!exec.startedAt && (
          <div className="d-flex gap-3">
            <button className="btn btn-primary" onClick={start}>
              Погнали!
            </button>
            <button className="btn btn-warning" onClick={pass}>
              Пропустить...
            </button>
          </div>
        )}
        {exec.isPassed && <GrRun title="Упражнение было пропущено" />}
      </div>
      <div className="card-body">
        <TrainingExecuteForm exercise={exec} />
      </div>
    </div>
  );
}
