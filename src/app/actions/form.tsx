"use client";

import type {
  Action,
  Muscle,
  ActionsOnMusclesAgony,
  ActionsOnMusclesSynergy,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { useState } from "react";
import { handleCreate, handleUpdate } from "@/app/actions/actions";

type Props = {
  muscles: Array<Muscle & { Group: { title: string } }>;
  action?: Action & {
    MusclesSynergy: ActionsOnMusclesAgony[];
    MusclesAgony: ActionsOnMusclesSynergy[];
  };
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
      if (action) {
        await handleUpdate(action.id, data);
      } else {
        await handleCreate(data);
      }
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
          <label className="form-label">Мышцы-агонисты</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesAgonyIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesAgony.reduce((prev, curr) => {
                    return prev || curr.muscleId === m.id;
                  }, false)
                }
              >
                {m.Group.title}: {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Мышцы-синергисты</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesSynergyIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesSynergy.reduce((prev, curr) => {
                    return prev || curr.muscleId === m.id;
                  }, false)
                }
              >
                {m.Group.title}: {m.title}
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
          <label className="form-label">Сокращенное название</label>
          <input
            className="form-control"
            {...form.register("alias", { required: false })}
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
