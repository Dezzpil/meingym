"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { handleCreate } from "@/app/actions/actions";

export function ActionCreateForm() {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const form = useForm<ActionsFormFieldsType>();
  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    setHandling(true);
    try {
      await handleCreate(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  });
  return (
    <form onSubmit={onSubmit} className="form">
      <div className="mb-2">
        <label className="form-label">Название</label>
        <input
          className="form-control"
          {...form.register("title", { required: true })}
        />
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
  );
}
