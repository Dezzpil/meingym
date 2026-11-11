"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import classNames from "classnames";
import type { TrainingDynamics } from "@/core/dynamics";
import { Sparkline } from "@/components/Sparkline";

type Props = {
  training: {
    id: number;
    difficultyScore: number;
    executedDifficultyScore: number;
  };
  isStarted: boolean;
  hasBoostedApproaches: boolean;
  dynamics?: TrainingDynamics;
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
  dynamics,
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

  // 0 в executedDifficultyScore — «данных о выполнении нет», а не «тренировка была лёгкой»
  const hasPair =
    training.difficultyScore > 0 && training.executedDifficultyScore > 0;
  const delta =
    dynamics?.hasEnoughData && dynamics.relativeToMean !== null
      ? dynamics.relativeToMean
      : null;
  const deltaIsUp = delta !== null && delta >= 0;

  return (
    <>
      <div className="d-inline-flex align-items-center column-gap-2 flex-fill flex-wrap">
        <b>Сложность:</b>
        {hasPair ? (
          <span
            className="d-inline-flex align-items-baseline column-gap-1"
            title="Плановая сложность → сложность по фактическим подъёмам"
          >
            <span className="text-muted">
              {training.difficultyScore.toFixed(1)}
            </span>
            <span className="text-muted small">&rarr;</span>
            <b>{training.executedDifficultyScore.toFixed(1)}</b>
          </span>
        ) : (
          <span>{training.difficultyScore.toFixed(1)}</span>
        )}
        {hasBoostedApproaches && <span title="Подходы усложнены">⚡</span>}
        {delta !== null && (
          <Link
            href="/trainings/dynamics"
            className={classNames(
              "d-inline-flex align-items-center column-gap-1 text-decoration-none small fw-semibold",
              deltaIsUp ? "text-success" : "text-muted",
            )}
            title="Плановая сложность относительно среднего по этой же нити тренировок. Нажмите для просмотра динамики"
          >
            {deltaIsUp ? "+" : ""}
            {delta.toFixed(0)}% к среднему
            {dynamics!.sparkline.length >= 2 && (
              <Sparkline
                data={dynamics!.sparkline}
                width={50}
                height={16}
                color={deltaIsUp ? "#4e9a2e" : "#6c757d"}
              />
            )}
          </Link>
        )}
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
