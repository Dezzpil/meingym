import React from "react";
import type { SetsStats } from "@/core/types";
import type { ApproachesGroup, TrainingExercise } from "@prisma/client";
import { NumberDiffViz } from "@/components/NumberDiffViz";
import classNames from "classnames";

type Props = { current: SetsStats; prev?: SetsStats; className?: string };
type PropsForApproachGroup = { group: ApproachesGroup; className?: string };
type PropsForExercise = {
  exercise: TrainingExercise & {
    ApproachGroup: ApproachesGroup;
    TrainingExerciseExecution: any[];
  };
  className?: string;
};

export function SetsStats({ current, prev, className }: Props) {
  return (
    <ul className={classNames("text-muted small list-inline", className)}>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>Σ кг:</b>
        <NumberDiffViz
          prev={prev ? prev.sum : undefined}
          current={current.sum}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>÷ кг:</b>
        <NumberDiffViz
          prev={prev ? prev.mean : undefined}
          current={current.mean}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>Σ раз:</b>
        <NumberDiffViz
          prev={prev ? prev.countTotal : undefined}
          current={current.countTotal}
          toFixed={false}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>÷ раз:</b>
        <NumberDiffViz
          prev={prev ? prev.countTotal / prev.count : undefined}
          current={current.countTotal / current.count}
        />
      </li>
    </ul>
  );
}

export function SetsStatsForApproachGroup({
  group,
  className,
}: PropsForApproachGroup) {
  return <SetsStats current={group} className={className} />;
}

export function SetsStatsForExercise({
  exercise,
  className,
}: PropsForExercise) {
  const current: SetsStats = {
    sum: exercise.liftedSum,
    mean: exercise.liftedMean,
    countTotal: exercise.liftedCountTotal,
    count: exercise.TrainingExerciseExecution.length,
  };
  return (
    <SetsStats
      current={current}
      prev={exercise.ApproachGroup}
      className={className}
    />
  );
}
