"use client";
import type { Action, Training, TrainingExercise } from "@prisma/client";
import { Purpose } from "@prisma/client";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { useForm } from "react-hook-form";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";

type Props = {
  training: Training;
  actions: Action[];
  exercises: TrainingExercise[];
};

export default function AddExerciseForm({
  training,
  actions,
  exercises,
}: Props) {
  const form = useForm<ExerciseAddFieldsType>();
  const submit = form.handleSubmit(async (data) => {
    try {
      await handleAddExercise(training.id, data);
    } catch (e) {
      console.error(e);
    }
  });

  return (
    <>
      <form className="mb-3 row" onSubmit={submit}>
        <div className="col-auto">
          <label className="visually-hidden">Упражнение</label>
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
        <div className="col-auto">
          <label className="visually-hidden">Цель</label>
          <select className="form-control" {...form.register("purpose")}>
            <option value={Purpose.STRENGTH}>На силу</option>
            <option value={Purpose.MASS}>На массу</option>
          </select>
        </div>
        <div className="col-auto">
          <label className="visually-hidden">Порядок</label>
          <input
            type="number"
            className="form-control"
            readOnly
            {...form.register("priority", {
              valueAsNumber: true,
              value: exercises.length + 1,
              min: 1,
              max: 10,
            })}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-success">Добавить</button>
        </div>
      </form>
    </>
  );
}
