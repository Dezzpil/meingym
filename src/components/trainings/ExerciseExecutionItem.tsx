"use client";

import { GiWeight } from "react-icons/gi";
import React, { useCallback, useState } from "react";
import type { TrainingExerciseExecution } from "@prisma/client";
import { GrCheckmark, GrLike, GrUpgrade } from "react-icons/gr";
import classNames from "classnames";
import type { RegisterOptions } from "react-hook-form";
import { handleTrainingExerciseStart } from "@/app/trainings/[id]/execute/actions";
type Props = {
  exec: TrainingExerciseExecution;
  register: CallableFunction;
};
export default function ExerciseExecutionItem({ exec, register }: Props) {
  const [isCompleted, setCompleted] = useState<boolean>(
    !!(exec.liftedWeight && exec.liftedCount),
  );
  const [isLiked, setLiked] = useState<boolean>(false);
  const [isUpgraded, setUpgraded] = useState<boolean>(false);
  const focus = useCallback((e: any) => {
    const target = e.target;
    e.target.value = parseInt(target.placeholder as string);
  }, []);
  const complete = useCallback(() => {
    console.log("complete");
    setCompleted((val) => !val);
  }, []);
  const like = useCallback(() => {
    console.log("like");
    setLiked((val) => !val);
  }, []);
  const upgrade = useCallback(() => {
    console.log("upgrade");
    setUpgraded((val) => !val);
  }, []);
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
          disabled={isCompleted}
          onFocus={focus}
          {...register(`[${exec.id}].liftedWeight`, {
            valueAsNumber: true,
            min: 0,
            value: exec.liftedWeight ? exec.liftedWeight : null,
          } as RegisterOptions)}
        />
        <span className="input-group-text">x</span>
        <input
          type="number"
          className="form-control"
          placeholder={exec.plannedCount + ""}
          disabled={isCompleted}
          onFocus={focus}
          {...register(`[${exec.id}].liftedCount`, {
            valueAsNumber: true,
            min: 0,
            value: exec.liftedCount ? exec.liftedCount : null,
          } as RegisterOptions)}
        />
      </div>
      <button
        className={classNames("btn", {
          "btn-light": !isCompleted,
          "btn-success": isCompleted,
        })}
        onClick={complete}
      >
        <GrCheckmark />
      </button>
      <button
        className={classNames("btn", {
          "btn-default": !isLiked,
          "btn-outline-success": isLiked,
        })}
        type="button"
        onClick={like}
      >
        <GrLike />
      </button>
      <button
        className={classNames("btn", {
          "btn-default": !isUpgraded,
          "btn-outline-success": isUpgraded,
        })}
        type="button"
        onClick={upgrade}
      >
        <GrUpgrade />
      </button>
    </div>
  );
}
