"use client";

import type React from "react";
import type { Training } from "@prisma/client";
type Props = {
  training: Training;
};
export function TrainingTimeScore({ training }: Props) {
  return (
    <div className="d-inline-flex gap-3">
      <b>Примерное время выполнения:</b>
      <span>
        {training.timeScoreInMins ? training.timeScoreInMins.toFixed(2) : 0}{" "}
        мин.
      </span>
    </div>
  );
}
