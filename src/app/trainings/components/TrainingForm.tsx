"use client";

import { Training } from "@prisma/client";
import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/types";
import { useState } from "react";
import { handleTrainingUpdate } from "@/app/trainings/[id]/actions";
import moment from "moment";

type Props = {
  training: Training;
};

export function TrainingForm({ training }: Props) {
  const form = useForm<TrainingFormFieldsType>({
    defaultValues: Object.assign(training, {
      plannedTo: moment(training.plannedTo).format("YYYY-MM-DD"),
    }),
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const [dateIsChanged, setDateIsChanged] = useState<boolean>(false);
  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    const result = await handleTrainingUpdate(training.id, data, dateIsChanged);
    if (!result.ok) {
      setError(result.error);
    }
    setHandling(false);
  });

  return (
    <form onSubmit={submit}>
      <div className="mb-2">
        <label className="form-label">Дата занятия</label>
        <input
          type="date"
          className="form-control"
          {...form.register("plannedTo", {
            required: true,
            valueAsDate: true,
            onChange: () => {
              setDateIsChanged(true);
            },
          })}
        />
      </div>
      <div className="mb-2">
        <label htmlFor="commonComment" className="form-label">
          Комментарий
        </label>
        <textarea
          className="form-control"
          {...form.register("commonComment")}
        ></textarea>
      </div>
      <div className="form-check mb-2">
        <input
          type="checkbox"
          className="form-check-input"
          {...form.register("isCircuit")}
        />
        <label htmlFor="isCircuit" className="form-check-label">
          Круговая тренировка?
        </label>
      </div>
      <div className="mb-2 hstack justify-content-end gap-2">
        <button className="btn btn-outline-primary" disabled={handling}>
          Сохранить
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </form>
  );
}
