"use client";

import type {
  Action,
  Muscle,
  ActionsOnMusclesAgony,
  ActionsOnMusclesSynergy,
  ActionsOnMusclesStabilizer,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { useState } from "react";
import { handleUpdate } from "@/app/actions/actions";
import { ActionRig } from "@prisma/client";

type Props = {
  muscles: Array<Muscle & { Group: { title: string } }>;
  action: Action & {
    MusclesSynergy: ActionsOnMusclesAgony[];
    MusclesAgony: ActionsOnMusclesSynergy[];
    MusclesStabilizer: ActionsOnMusclesStabilizer[];
  };
  control?: boolean;
};

export default function ActionForm({ muscles, action, control }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const form = useForm<ActionsFormFieldsType>({
    defaultValues: action,
    disabled: !control,
  });
  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    setHandling(true);
    try {
      await handleUpdate(action.id, data);
    } catch (e: any) {
      console.error(e);
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
        <div className="row row-cols-lg-auto g-3 align-items-center mb-2">
          <div className="col-12">
            <div className="form-check">
              <input
                type="checkbox"
                id="strengthAllowed"
                className="form-check-input"
                {...form.register("strengthAllowed", {})}
              />
              <label htmlFor="strengthAllowed" className="form-check-label">
                Допустимо выполнение на силу?
              </label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-check col-auto">
              <input
                type="checkbox"
                id="bigCount"
                className="form-check-input"
                {...form.register("bigCount", {})}
              />
              <label htmlFor="bigCount" className="form-check-label">
                Многоповторное?
              </label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-check col-auto">
              <input
                type="checkbox"
                id="allowCheating"
                className="form-check-input"
                {...form.register("allowCheating", {})}
              />
              <label htmlFor="allowCheating" className="form-check-label">
                Позволяет читинг?
              </label>
            </div>
          </div>
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
          <label className="form-label">Мышцы-стабилизаторы</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesStabilizerIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesStabilizer.reduce((prev, curr) => {
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
          <label className="form-label">Отягощение</label>
          <select className="form-control" {...form.register("rig")}>
            {[
              { value: ActionRig.BLOCKS, label: "Блочное" },
              { value: ActionRig.BARBELL, label: "Со штангой" },
              { value: ActionRig.DUMBBELL, label: "С гантелей" },
              { value: ActionRig.OTHER, label: "С собственным весом" },
            ].map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>{" "}
        <div className="mb-2">
          <label className="form-label">Описание</label>
          <textarea
            className="form-control"
            {...form.register("desc", { required: false })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Другие названия</label>
          <textarea
            className="form-control"
            {...form.register("anotherTitles", { required: false })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Сокращенное название</label>
          <input
            className="form-control"
            {...form.register("alias", { required: false })}
          />
        </div>
        {control && (
          <>
            <div className="mb-2">
              <button className="btn btn-success" disabled={handling}>
                Сохранить
              </button>
            </div>
            {error && <div className="mb-2 alert alert-danger">{error}</div>}
          </>
        )}
      </form>
    </>
  );
}
