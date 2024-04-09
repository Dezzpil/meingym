"use client";

import { useForm } from "react-hook-form";
import ExerciseExecutionItem from "@/components/trainings/ExerciseExecutionItem";
import React from "react";
import type {
  TrainingExercise,
  TrainingExerciseExecution,
} from "@prisma/client";
import {
  countExerciseNonExecuted,
  handleTrainingExerciseExecuted,
} from "@/app/trainings/[id]/execute/actions";
import moment from "moment";
import { GrCheckmark } from "react-icons/gr";

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
      );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row mb-2">
        {exercise.TrainingExerciseExecution.map((exec) => (
          <ExerciseExecutionItem
            key={exec.id}
            exec={exec}
            register={register}
            disabled={disabled}
          />
        ))}
      </div>
      {exercise.completedAt ? (
        <div className="alert alert-success mb-0">
          Упражнение выполнено {moment(exercise.completedAt).fromNow()}
        </div>
      ) : (
        <div className="d-flex justify-content-between gap-2">
          <button type="button" disabled={disabled} className="btn btn-default">
            Еще подход!
          </button>
          <button disabled={disabled} className="btn btn-light">
            <GrCheckmark />
          </button>
        </div>
      )}
    </form>
  );
}
