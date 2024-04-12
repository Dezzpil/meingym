"use client";

import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/create/types";
import { handleCreateTraining } from "@/app/trainings/create/actions";
import { useState } from "react";

export default function TrainingForm() {
  const form = useForm<TrainingFormFieldsType>();
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);

  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleCreateTraining(data);
    } catch (e: any) {
      setError(e.message);
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
          {...form.register("plannedTo", { required: true, valueAsDate: true })}
        />
      </div>
      <div className="mb-2">
        <button className="btn btn-success" disabled={handling}>
          Сохранить
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </form>
  );
}
