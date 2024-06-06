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
    <div className={classNames("d-flex gap-3 text-muted small", className)}>
      <div className="hstack gap-1">
        <span>Σ кг:</span>
        <NumberDiffViz
          prev={prev ? prev.sum : undefined}
          current={current.sum}
        />
      </div>
      <div className="hstack gap-1">
        <span>÷ кг:</span>
        <NumberDiffViz
          prev={prev ? prev.mean : undefined}
          current={current.mean}
        />
      </div>
      <div className="hstack gap-1">
        <span>Σ раз:</span>
        <NumberDiffViz
          prev={prev ? prev.countTotal : undefined}
          current={current.countTotal}
          toFixed={false}
        />
      </div>
      <div className="hstack gap-1">
        <span>÷ раз:</span>
        <NumberDiffViz
          prev={prev ? prev.countTotal / prev.count : undefined}
          current={current.countTotal / current.count}
        />
      </div>
    </div>
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
