"use client";

import type React from "react";
import type { Training } from "@prisma/client";
import moment from "moment/moment";
type Props = {
  training: Training;
};
export function TrainingTimeScore({ training }: Props) {
  return (
    <>
      <div className="d-inline-flex gap-3">
        <b>Оценочное время:</b>
        <span>
          {training.timeScoreInMins ? training.timeScoreInMins.toFixed(2) : 0}{" "}
          мин.
        </span>
      </div>
      {training.completedAt && (
        <div className="d-inline-flex gap-3">
          <b>Реальное время:</b>
          <span>
            {moment(training.completedAt).diff(
              moment(training.startedAt),
              "minute",
            )}{" "}
            мин.
          </span>
        </div>
      )}
    </>
  );
}
