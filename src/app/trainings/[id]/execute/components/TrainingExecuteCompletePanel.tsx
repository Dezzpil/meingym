"use client";
import type { Training } from "@prisma/client";
import React from "react";
import moment from "moment";
import { TrainingRepeatForm } from "@/app/trainings/[id]/execute/components/TrainingRepeatForm";

type Props = {
  training: Training;
};
export function TrainingExecuteCompletePanel({ training }: Props) {
  return (
    training.completedAt && (
      <div className="alert alert-light d-flex gap-5 justify-content-between align-items-baseline">
        <div className="mb-2">
          Завершена в {moment(training.completedAt).format("H:mm")} (+
          {moment(training.completedAt).diff(
            moment(training.startedAt),
            "minute",
          )}{" "}
          мин.)!
        </div>
        <TrainingRepeatForm training={training} />
      </div>
    )
  );
}
