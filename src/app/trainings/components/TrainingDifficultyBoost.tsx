"use client";

import React, { useTransition } from "react";

type Props = {
  training: { id: number; difficultyScore: number };
  isStarted: boolean;
  hasBoostedApproaches: boolean;
};

/**
 * Пока спрятать эту логику - возможно пригодится позже, когда автоматически тренировки будем собирать
 * @param param0
 * @param param0.training
 * @param param0.isStarted
 * @param param0.hasBoostedApproaches
 * @constructor
 */
export function TrainingDifficultyBoost({
  training,
  isStarted,
  hasBoostedApproaches,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // const handleClick = () => {
  //   startTransition(async () => {
  //     if (hasBoostedApproaches) {
  //       await handleRevertDifficultyBoost(training.id);
  //     } else {
  //       await handleApplyDifficultyBoost(training.id);
  //     }
  //   });
  // };

  return (
    <>
      <div className="d-inline-flex column-gap-2 flex-fill flex-wrap">
        <b>Сложность:</b>
        <span>{training.difficultyScore.toFixed(1)}</span>
        {hasBoostedApproaches && <span>⚡</span>}
      </div>
      {/*<button*/}
      {/*  type="button"*/}
      {/*  className={classNames("btn", {*/}
      {/*    "btn-outline-success": !hasBoostedApproaches,*/}
      {/*    "btn-outline-secondary": hasBoostedApproaches,*/}
      {/*  })}*/}
      {/*  disabled={isStarted || isPending}*/}
      {/*  onClick={handleClick}*/}
      {/*>*/}
      {/*  {isPending*/}
      {/*    ? "..."*/}
      {/*    : hasBoostedApproaches*/}
      {/*      ? "Проще"*/}
      {/*      : "Сделать сложнее!"}*/}
      {/*</button>*/}
    </>
  );
}
