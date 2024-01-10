"use client";

import type { Actions, Muscle } from "@prisma/client";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { useState } from "react";
import { handleCreate } from "@/app/actions/actions";

type Props = {
  muscles: Muscle[];
  action?: Actions;
};

export default function ActionsForm({ muscles, action }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const form = useForm<ActionsFormFieldsType>({
    defaultValues: action,
  });
  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    setHandling(true);
    try {
      await handleCreate(data);
    } catch (e: any) {
      setError(e.message);
    }
    setHandling(false);
  });
  return (
    <>
      <form onSubmit={onSubmit} className="form">
        <div className="mb-2">
          <label className="form-label">Название</label>
          <input
            className="form-control"
            {...form.register("title", { required: true })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Мышца-агонист</label>
          <select
            className="form-control"
            {...form.register("muscleAgonyId", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Описание</label>
          <textarea
            className="form-control"
            {...form.register("desc", { required: false })}
          />
        </div>
        <div className="mb-2">
          <button className="btn btn-success" disabled={handling}>
            Сохранить
          </button>
        </div>
        {error && <div className="mb-2 alert alert-danger">{error}</div>}
      </form>
    </>
  );
}