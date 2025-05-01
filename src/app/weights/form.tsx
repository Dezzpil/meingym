"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { handleWeightSave, WeightType } from "@/app/weights/actions";

type Props = { value?: number };
export function WeightsForm({ value }: Props) {
  const form = useForm<WeightType>({
    defaultValues: { value: value ? value : 0 },
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleWeightSave(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  });
  return (
    <form className="mb-3" onSubmit={submit}>
      <div className="d-flex gap-3 justify-content-end align-items-baseline">
        <div>Ваш вес сегодня:</div>
        <div className="col-2">
          <input
            type="number"
            step={0.1}
            min={20}
            max={200}
            className="form-control"
            {...form.register("value", { valueAsNumber: true, required: true })}
          />
        </div>
        <button disabled={handling} className="btn btn-outline-primary">
          Сохранить
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </form>
  );
}
