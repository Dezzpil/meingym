"use client";
import type { Training } from "@prisma/client";
import React from "react";
import moment from "moment";

type Props = {
  training: Training;
};
export function TrainingExecuteComplete({ training }: Props) {
  return (
    training.completedAt && (
      <div className="alert alert-success">
        Завершена в {moment(training.completedAt).format("H:mm")} (+
        {moment(training.completedAt).diff(
          moment(training.startedAt),
          "minute",
        )}{" "}
        мин.)!
      </div>
    )
  );
}
