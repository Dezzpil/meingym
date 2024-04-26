"use client";

import { useForm } from "react-hook-form";
import TrainingExecuteItem from "@/app/trainings/[id]/execute/components/TrainingExecuteItem";
import React, { useCallback, useState } from "react";
import type {
  TrainingExercise,
  TrainingExerciseExecution,
} from "@prisma/client";
import {
  countExerciseNonExecuted,
  handleAddExecutionApproach,
  handleTrainingExerciseExecuted,
} from "@/app/trainings/[id]/execute/actions";
import moment from "moment";
import { GrCheckmark } from "react-icons/gr";
import { FaSpinner } from "react-icons/fa6";

type Props = {
  exercise: TrainingExercise & {
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
};

export function TrainingExecuteForm({ exercise, disabled }: Props) {
  const { register, handleSubmit } = useForm<any>();
  const onSubmit = async (data: any) => {
    let force = true;
    const result = await countExerciseNonExecuted(exercise.id);
    if (result) {
      force = confirm("Не все подходы выполнены, завершить упражнение?");
    }
    if (force)
      await handleTrainingExerciseExecuted(
        exercise.id,
        data,
        exercise.trainingId,
        exercise.actionId,
      );
  };

  const [isAddingApproach, setAddingApproach] = useState<boolean>(false);
  const [errorAddingApproach, setErrorAddingApproach] = useState<string | null>(
    null,
  );
  const addApproach = useCallback(async () => {
    setErrorAddingApproach(null);
    setAddingApproach(true);
    try {
      await handleAddExecutionApproach(exercise.trainingId, exercise.id);
    } catch (e: any) {
      setErrorAddingApproach(e.message);
    } finally {
      setAddingApproach(false);
    }
  }, [exercise.id, exercise.trainingId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row mb-2">
        {exercise.TrainingExerciseExecution.map((exec) => (
          <TrainingExecuteItem
            key={exec.id}
            exec={exec}
            register={register}
            disabled={disabled}
          />
        ))}
      </div>
      {exercise.completedAt ? (
        exercise.isPassed ? (
          <div className="alert alert-warning mb-0">Упражнение пропущено</div>
        ) : (
          <div className="alert alert-success mb-0">
            Упражнение выполнено в {moment(exercise.completedAt).format("H:mm")}{" "}
            (+
            {moment(exercise.completedAt).diff(
              moment(exercise.startedAt),
              "minute",
            )}{" "}
            мин.)
          </div>
        )
      ) : (
        <>
          <div className="d-flex justify-content-between gap-2">
            <button
              onClick={addApproach}
              type="button"
              disabled={isAddingApproach || disabled}
              className="btn btn-default"
            >
              {isAddingApproach ? <FaSpinner /> : <span>Еще подход!</span>}
            </button>
            <button disabled={disabled} className="btn btn-light">
              <GrCheckmark />
            </button>
          </div>
          {errorAddingApproach && (
            <div className="alert alert-danger">{errorAddingApproach}</div>
          )}
        </>
      )}
    </form>
  );
}
