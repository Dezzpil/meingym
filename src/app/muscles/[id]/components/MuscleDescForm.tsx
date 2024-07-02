"use client";

import { useForm } from "react-hook-form";
import type { Muscle, MuscleDesc } from "@prisma/client";
import { useCallback, useState } from "react";
import {
  handleMuscleAddDesc,
  handleMuscleDeleteDesc,
  handleMuscleUpdateDesc,
  MuscleDescType,
} from "@/app/muscles/actions";

type Props = {
  muscle: Muscle;
  desc?: MuscleDesc;
  control?: boolean;
};
export function MuscleDescForm({ muscle, desc, control }: Props) {
  const form = useForm<MuscleDescType>({
    defaultValues: desc ? desc : {},
    disabled: !control,
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState(false);
  const del = useCallback(async () => {
    if (desc) {
      setHandling(true);
      await handleMuscleDeleteDesc(muscle.id, desc.id);
    }
  }, [desc, muscle.id]);
  const submit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      if (desc) {
        await handleMuscleUpdateDesc(muscle.id, desc.id, data);
      } else {
        await handleMuscleAddDesc(muscle.id, data);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  });
  return (
    <form onSubmit={submit} className="mb-3">
      <textarea
        rows={3}
        className="form-control mb-2"
        placeholder="Описание мышцы"
        {...form.register("text", { required: true, minLength: 1 })}
      ></textarea>
      <input
        type="text"
        className="form-control mb-2"
        placeholder="https://"
        {...form.register("link", { required: false })}
      />

      {control && (
        <>
          <div className="hstack gap-2">
            <button disabled={handling} className="btn btn-secondary">
              {desc ? "Обновить" : "Добавить"}
            </button>
            {desc && (
              <button type="button" onClick={del} className="btn btn-warning">
                Удалить
              </button>
            )}
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
        </>
      )}
    </form>
  );
}
