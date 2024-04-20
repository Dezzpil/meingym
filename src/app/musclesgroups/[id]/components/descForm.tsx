"use client";

import { useForm } from "react-hook-form";
import {
  handleMuscleGroupAddDesc,
  handleMuscleGroupDelete,
  handleMuscleGroupUpdateDesc,
  MuscleGroupDescType,
} from "@/app/musclesgroups/[id]/actions";
import type { MuscleGroup, MuscleGroupDesc } from "@prisma/client";
import { useCallback, useState } from "react";
type Props = {
  group: MuscleGroup;
  canControl: boolean;
  desc?: MuscleGroupDesc;
};
export function MuscleGroupsDescForm({ group, canControl, desc }: Props) {
  const form = useForm<MuscleGroupDescType>({
    defaultValues: desc ? desc : {},
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState(false);
  const del = useCallback(async () => {
    if (desc) {
      setHandling(true);
      await handleMuscleGroupDelete(desc.id);
    }
  }, [desc]);
  const submit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      if (desc) {
        await handleMuscleGroupUpdateDesc(group.id, desc.id, data);
      } else {
        await handleMuscleGroupAddDesc(group.id, data);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setHandling(false);
  });
  return (
    <form onSubmit={submit} className="mb-3">
      <textarea
        disabled={!canControl}
        rows={3}
        className="form-control mb-2"
        placeholder="Описание мышечной группы"
        {...form.register("text", { required: true, minLength: 1 })}
      ></textarea>
      <input
        disabled={!canControl}
        type="text"
        className="form-control mb-2"
        placeholder="https://"
        {...form.register("link", { required: false })}
      />
      {canControl && (
        <>
          <div className="hstack gap-2">
            <button disabled={handling} className="btn btn-primary">
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
