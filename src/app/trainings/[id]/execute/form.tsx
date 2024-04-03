"use client";

import { useForm } from "react-hook-form";
import ExerciseExecutionItem from "@/components/trainings/ExerciseExecutionItem";
import React from "react";
import type {
  TrainingExercise,
  TrainingExerciseExecution,
} from "@prisma/client";
import { handleTrainingExerciseExecuted } from "@/app/trainings/[id]/execute/actions";
import moment from "moment";

type Props = {
  exercise: TrainingExercise & {
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
};

export function TrainingExecuteForm({ exercise }: Props) {
  const { register, handleSubmit } = useForm<any>();
  const onSubmit = async (data: any) => {
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
          />
        ))}
      </div>
      {exercise.completedAt ? (
        <div className="alert alert-success mb-0">
          Упражнение выполнено {moment(exercise.completedAt).fromNow()}
        </div>
      ) : (
        <div className="d-flex justify-content-start gap-2">
          <button className="btn btn-success">Закончили</button>
          <button className="btn btn-default">Еще подход!</button>
        </div>
      )}
    </form>
  );
}
