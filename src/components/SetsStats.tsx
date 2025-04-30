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
          prev={prev ? prev.weightSum : undefined}
          current={current.weightSum}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>÷ кг:</b>
        <NumberDiffViz
          prev={prev ? prev.weightMean : undefined}
          current={current.weightMean}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>MAX кг:</b>
        <NumberDiffViz
          prev={prev ? prev.weightMax : undefined}
          current={current.weightMax}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>Σ раз:</b>
        <NumberDiffViz
          prev={prev ? prev.countSum : undefined}
          current={current.countSum}
          toFixed={false}
        />
      </li>
      <li className="list-inline-item d-inline-flex gap-1">
        <b>÷ раз:</b>
        <NumberDiffViz
          prev={prev ? prev.countMean : undefined}
          current={current.countMean}
        />
      </li>
    </ul>
  );
}

export function SetsStatsForApproachGroup({
  group,
  className,
}: PropsForApproachGroup) {
  const current: SetsStats = {
    len: group.count,
    weightSum: group.sum,
    weightMean: group.mean,
    weightMax: group.max,
    countSum: group.countTotal,
    countMean: group.countMean,
  };
  return <SetsStats current={current} className={className} />;
}

export function SetsStatsForExercise({
  exercise,
  className,
}: PropsForExercise) {
  const prev: SetsStats = {
    len: exercise.ApproachGroup.count,
    weightSum: exercise.ApproachGroup.sum,
    weightMean: exercise.ApproachGroup.mean,
    weightMax: exercise.ApproachGroup.max,
    countSum: exercise.ApproachGroup.countTotal,
    countMean: exercise.ApproachGroup.countMean,
  };
  const current: SetsStats = {
    len: exercise.TrainingExerciseExecution.length,
    weightSum: exercise.liftedSum,
    weightMean: exercise.liftedMean,
    weightMax: exercise.liftedMax,
    countSum: exercise.liftedCountTotal,
    countMean: exercise.liftedCountMean,
  };
  return <SetsStats current={current} prev={prev} className={className} />;
}
