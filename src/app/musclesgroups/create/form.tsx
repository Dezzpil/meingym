"use client";

import { useForm } from "react-hook-form";
import { handleSubmitAction } from "@/app/musclesgroups/create/action";
import { useState } from "react";
import { MusclesGroupsFormFieldsType } from "@/app/musclesgroups/create/types";

export default function MusclesGroupsCreateForm() {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);
  const { register, handleSubmit } = useForm<MusclesGroupsFormFieldsType>();
  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      await handleSubmitAction(data);
    } catch (e: any) {
      setError(e.message);
    }
    setSubmitting(false);
  });

  return (
    <>
      <form onSubmit={onSubmit} className="mb-3">
        <div className="mb-2">
          <label className="form-label">Название</label>
          <input
            className="form-control"
            type="text"
            {...register("title", { required: true })}
          />
        </div>
        <div className="mb-2">
          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting}
          >
            Создать
          </button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
      </form>
    </>
  );
}
