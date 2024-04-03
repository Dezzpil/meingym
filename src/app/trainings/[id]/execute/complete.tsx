"use client";
import type { Training } from "@prisma/client";
import React, { useCallback } from "react";
import {
  handleTrainingComplete,
  handleTrainingStart,
} from "@/app/trainings/[id]/execute/actions";
import moment from "moment";

type Props = {
  training: Training;
};
export function TrainingExecuteComplete({ training }: Props) {
  const complete = useCallback(async () => {
    await handleTrainingComplete(training.id);
  }, [training]);
  return !training.completedAt ? (
    <div className="d-flex gap-3 align-items-end mb-3">
      <button className="btn btn-primary" onClick={complete}>
        Завершить тренировку
      </button>
    </div>
  ) : (
    <div className="alert alert-success">
      <span></span>
      Тренировка была завершена {moment(training.completedAt).fromNow()}
    </div>
  );
}
