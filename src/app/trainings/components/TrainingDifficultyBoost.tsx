"use client";

import React, { useTransition } from "react";
import {
  handleApplyDifficultyBoost,
  handleRevertDifficultyBoost,
} from "@/app/trainings/[id]/difficulty/actions";
import classNames from "classnames";

type Props = {
  training: { id: number; difficultyScore: number };
  isStarted: boolean;
  hasBoostedApproaches: boolean;
};

export function TrainingDifficultyBoost({
  training,
  isStarted,
  hasBoostedApproaches,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      if (hasBoostedApproaches) {
        await handleRevertDifficultyBoost(training.id);
      } else {
        await handleApplyDifficultyBoost(training.id);
      }
    });
  };

  return (
    <>
      <div className="d-inline-flex column-gap-2 flex-fill flex-wrap">
        <b>Сложность:</b>
        <span>{training.difficultyScore.toFixed(1)}</span>
        {hasBoostedApproaches && <span>⚡</span>}
      </div>
      <button
        type="button"
        className={classNames("btn", {
          "btn-outline-success": !hasBoostedApproaches,
          "btn-outline-secondary": hasBoostedApproaches,
        })}
        disabled={isStarted || isPending}
        onClick={handleClick}
      >
        {isPending
          ? "..."
          : hasBoostedApproaches
            ? "Проще"
            : "Сделать сложнее!"}
      </button>
    </>
  );
}
