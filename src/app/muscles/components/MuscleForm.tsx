"use client";

import { useForm } from "react-hook-form";
import { MusclesFormFieldsType } from "@/app/muscles/create/types";
import type { Muscle, MuscleGroup } from "@prisma/client";
import { useCallback, useState } from "react";
import { handleCreate, handleDelete } from "@/app/muscles/actions";

type Props = {
  groups: MuscleGroup[];
  muscle?: Muscle;
};

export default function MuscleForm({ groups, muscle }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const form = useForm<MusclesFormFieldsType>({
    defaultValues: muscle,
  });
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
  const onDelete = useCallback(async () => {
    if (muscle) {
      if (confirm("Уверен?")) {
        setError(null);
        setHandling(true);
        try {
          await handleDelete(muscle.id);
        } catch (e: any) {
          console.error(e);
          setError(e.message);
        }
        setHandling(false);
      }
    }
  }, [muscle]);

  return (
    <>
      <form onSubmit={onSubmit} className="mb-3">
        <div className="mb-3">
          <label className="form-label">Название</label>
          <input
            className="form-control"
            {...form.register("title", { required: true })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Группа мышц</label>
          <select
            {...form.register("groupId", { valueAsNumber: true })}
            className="form-control"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2 d-flex justify-content-between">
          {!muscle ? (
            <button className="btn btn-success" disabled={handling}>
              Добавить
            </button>
          ) : (
            <>
              <button disabled={handling} className="btn btn-primary">
                Обновить
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="btn btn-danger"
                disabled={handling}
              >
                Удалить
              </button>
            </>
          )}
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
      </form>
    </>
  );
}