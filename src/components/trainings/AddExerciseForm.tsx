"use client";

import type { Action, Training } from "@prisma/client";
import { Purpose } from "@prisma/client";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { useForm } from "react-hook-form";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { BiPlus } from "react-icons/bi";
import React, { useState } from "react";

type Props = {
  training: Training;
  actions: Action[];
};

export default function AddExerciseForm({ training, actions }: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ExerciseAddFieldsType>({});
  const submit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await handleAddExercise(training.id, data);
    } catch (e: any) {
      setError(e.message);
    }
  });

  return (
    <>
      <form className="mb-3 d-flex gap-2" onSubmit={submit}>
        <div>
          <select
            className="form-control"
            {...form.register("actionId", { valueAsNumber: true })}
          >
            {actions.map((a) => (
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
  );
}
