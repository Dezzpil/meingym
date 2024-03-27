"use client";

import { GiWeight } from "react-icons/gi";
import React from "react";
import type { TrainingExerciseExecution } from "@prisma/client";
type Props = {
  exec: TrainingExerciseExecution;
};
export default function ExerciseExecutionItem({ exec }: Props) {
  return (
    <div className="mb-1 d-flex gap-2">
      <div className="input-group">
        <span className="input-group-text">
          <GiWeight />
        </span>
        <input
          type="number"
          className="form-control"
          placeholder={exec.plannedWeigth + ""}
          min={0}
        />
        <span className="input-group-text">x</span>
        <input
          type="number"
          className="form-control"
          placeholder={exec.plannedCount + ""}
          min={0}
        />
      </div>
      <div>🤘</div>
      <div>👎</div>
      <div>👻</div>
      <div>🌶</div>
    </div>
  );
}
