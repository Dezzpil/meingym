"use client";

import type { Action, Training, TrainingExercise } from "@prisma/client";
import { Purpose } from "@prisma/client";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { useForm } from "react-hook-form";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { BiPlus } from "react-icons/bi";
import React, { useMemo, useState } from "react";

type Props = {
  training: Training;
  actions: Action[];
  exercises: TrainingExercise[];
};

export default function TrainingAddExerciseForm({
  training,
  actions,
  exercises,
}: Props) {
  const exercisesMap = useMemo(() => {
    return Object.fromEntries(exercises.map((e) => [e.actionId, true]));
  }, [exercises]);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ExerciseAddFieldsType>({});
  const submit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await handleAddExercise(training.id, data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  });

  return actions.length > exercises.length ? (
    <>
      <form className="mb-3 d-flex gap-2" onSubmit={submit}>
        <div>
          <select
            className="form-control"
            {...form.register("actionId", { valueAsNumber: true })}
          >
            {actions
              .filter((a) => !(a.id in exercisesMap))
              .map((a) => (
                <option value={a.id} key={a.id}>
                  {a.alias ? a.alias : a.title}
                </option>
              ))}
          </select>
        </div>
        <div className="">
          <select className="form-control" {...form.register("purpose")}>
            <option value={Purpose.STRENGTH}>На силу</option>
            <option value={Purpose.MASS}>На массу</option>
          </select>
        </div>
        <div className="">
          <button className="btn btn-primary">
            <BiPlus />
          </button>
        </div>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  ) : null;
}
