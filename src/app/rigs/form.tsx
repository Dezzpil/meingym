"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { WeightsFields, WeightsFieldsType } from "@/app/rigs/types";
import { handleWeightsUpdate } from "@/app/rigs/actions";

type Props = {
  values: WeightsFieldsType;
};

export const WeightsForm: React.FC<Props> = ({ values }) => {
  const { register, handleSubmit } = useForm<WeightsFieldsType>({
    defaultValues: values,
  });

  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const submit = handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleWeightsUpdate(data);
    } catch (e: any) {
      setError(e.message);
    }
    setHandling(false);
  });

  return (
    <form onSubmit={submit}>
      <div className="mb-2">
        <label className="form-label">
          {WeightsFields.shape.block.description}
        </label>
        <input
          type="number"
          step={1}
          min={1}
          className="form-control"
          {...register("block", { valueAsNumber: true, required: true })}
        />
      </div>
      <div className="mb-2">
        <label className="form-label">
          {WeightsFields.shape.plateMin.description}
        </label>
        <input
          type="number"
          step={0.25}
          min={1}
          className="form-control"
          {...register("plateMin", { valueAsNumber: true, required: true })}
        />
      </div>
      <div className="mb-2">
        <label className="form-label">
          {WeightsFields.shape.barbellMin.description}
        </label>
        <input
          type="number"
          className="form-control"
          min={10}
          step={1}
          {...register("barbellMin", { valueAsNumber: true, required: true })}
        />
      </div>
      <div className="mb-2">
        <label className="form-label">
          {WeightsFields.shape.dumbbellStep.description}
        </label>
        <input
          type="number"
          min={1}
          step={0.25}
          className="form-control"
          {...register("dumbbellStep", { valueAsNumber: true, required: true })}
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
};
