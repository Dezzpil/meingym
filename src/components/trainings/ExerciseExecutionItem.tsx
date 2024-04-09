"use client";

import { GiWeight } from "react-icons/gi";
import React, { useCallback, useState } from "react";
import type { TrainingExerciseExecution } from "@prisma/client";
import { GrCheckmark } from "react-icons/gr";
import classNames from "classnames";
import type { RegisterOptions } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";
import { postApi } from "@/tools/fetch";

type Props = {
  exec: TrainingExerciseExecution;
  register: CallableFunction;
  disabled: boolean;
};
export default function ExerciseExecutionItem({
  exec,
  register,
  disabled,
}: Props) {
  const [isCompleted, setCompleted] = useState<boolean>(!!exec.executedAt);
  const [waitForCompleted, setWaitForCompleted] = useState<boolean>(false);

  const [liftedWeight, setLiftedWeight] = useState(0);
  const [liftedCount, setLiftedCount] = useState(0);

  const complete = useCallback(() => {
    setWaitForCompleted(true);
    if (!isCompleted) {
      postApi(`/api/trainings/exercise/complete?id=${exec.id}`, {
        id: exec.id,
        liftedWeight,
        liftedCount,
      })
        .then((data) => {
          console.log(data);
          setCompleted(!isCompleted);
        })
        .finally(() => {
          setWaitForCompleted(false);
        });
    } else {
      postApi(`/api/trainings/exercise/uncomplete?id=${exec.id}`, {
        id: exec.id,
      })
        .then((data) => {
          console.log(data);
          setCompleted(!isCompleted);
        })
        .finally(() => {
          setWaitForCompleted(false);
        });
    }
  }, [exec.id, isCompleted, liftedCount, liftedWeight]);

  const updateLiftedCount = useCallback((e: any) => {
    e.preventDefault();
    setLiftedCount(parseInt(e.target.value));
  }, []);

  const updateLiftedWeight = useCallback((e: any) => {
    e.preventDefault();
    setLiftedWeight(parseInt(e.target.value));
  }, []);

  return (
    <div className="mb-1 d-flex gap-2">
      <div className="input-group">
        <span className="input-group-text">
          <GiWeight />
        </span>
        <input
          type="number"
          step="0.1"
          className={classNames("form-control", {
            "text-success":
              exec.liftedWeight && exec.liftedWeight > exec.plannedWeigth,
            "text-warning":
              exec.liftedWeight && exec.liftedWeight < exec.plannedWeigth,
            "text-muted": exec.isPassed,
          })}
          disabled={isCompleted}
          onInput={updateLiftedWeight}
          {...register(`[${exec.id}].liftedWeight`, {
            valueAsNumber: true,
            min: 0,
            value: exec.liftedWeight ? exec.liftedWeight : exec.plannedWeigth,
            disabled,
          } as RegisterOptions)}
        />
        <span className="input-group-text">x</span>
        <input
          type="number"
          step="1"
          className={classNames("form-control", {
            "text-success":
              exec.liftedCount && exec.liftedCount > exec.plannedCount,
            "text-warning":
              exec.liftedCount && exec.liftedCount < exec.plannedCount,
            "text-muted": exec.isPassed,
          })}
          disabled={isCompleted}
          onInput={updateLiftedCount}
          {...register(`[${exec.id}].liftedCount`, {
            valueAsNumber: false,
            min: 0,
            value: exec.liftedCount ? exec.liftedCount : exec.plannedCount,
            disabled,
          } as RegisterOptions)}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        className={classNames("btn", {
          "btn-light": !isCompleted,
          "btn-success": isCompleted,
        })}
        onClick={complete}
      >
        {waitForCompleted ? <FaSpinner /> : <GrCheckmark />}
      </button>
    </div>
  );
}
