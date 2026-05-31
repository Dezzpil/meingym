"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  ACTION_REQUIRE_LABELS,
  ACTION_REQUIRE_VALUES,
  ACTION_RIG_LABELS,
  ACTION_RIG_VALUES,
  EquipmentFormFieldsType,
} from "../types";
import { handleEquipmentCreate, handleEquipmentUpdate } from "../actions";
import { useRouter } from "next/navigation";
import { ActionRequire, ActionRig } from ".prisma/client";

type Props = {
  id?: number;
  initial?: EquipmentFormFieldsType;
};

function buildDefaults(
  initial?: EquipmentFormFieldsType,
): EquipmentFormFieldsType {
  const rigs = ACTION_RIG_VALUES.map((type) => {
    const existing = initial?.rigs.find((r) => r.type === type);
    return {
      type,
      enabled: existing?.enabled ?? false,
      minWeight: existing?.minWeight,
      step: existing?.step,
      maxWeight: existing?.maxWeight,
    };
  });
  return {
    name: initial?.name ?? "",
    isDefault: initial?.isDefault ?? false,
    requires: initial?.requires ?? [],
    rigs,
  };
}

export default function EquipmentForm({ id, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch } =
    useForm<EquipmentFormFieldsType>({
      defaultValues: buildDefaults(initial),
    });
  const { fields } = useFieldArray({ control, name: "rigs" });
  const watchedRigs = watch("rigs");

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setSubmitting(true);
    try {
      if (id) {
        await handleEquipmentUpdate(id, data);
      } else {
        await handleEquipmentCreate(data);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="mb-3">
      <div className="mb-3">
        <label className="form-label">Название</label>
        <input
          className="form-control"
          type="text"
          {...register("name", { required: true })}
        />
      </div>

      <div className="form-check mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          id="isDefault"
          {...register("isDefault")}
        />
        <label className="form-check-label" htmlFor="isDefault">
          Использовать по умолчанию
        </label>
      </div>

      <h5 className="mb-3">Оборудование</h5>
      <div className="d-flex flex-wrap gap-3 mb-4">
        {ACTION_REQUIRE_VALUES.filter((v) => v !== ActionRequire.NONE).map(
          (type) => (
            <div className="form-check" key={type}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`require-${type}`}
                value={type}
                {...register("requires")}
              />
              <label className="form-check-label" htmlFor={`require-${type}`}>
                {ACTION_REQUIRE_LABELS[type]}
              </label>
            </div>
          ),
        )}
      </div>

      <h5 className="mb-3">Отягощения</h5>
      <div className="d-flex flex-column gap-2 mb-4">
        {fields.map((field, idx) => {
          const enabled = watchedRigs?.[idx]?.enabled;
          const type = field.type as ActionRig;
          return (
            <div
              key={field.id}
              className="border rounded p-2 d-flex flex-wrap align-items-center gap-3"
            >
              <input type="hidden" {...register(`rigs.${idx}.type` as const)} />
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`rig-${type}`}
                  {...register(`rigs.${idx}.enabled` as const)}
                />
                <label className="form-check-label" htmlFor={`rig-${type}`}>
                  {ACTION_RIG_LABELS[type]}
                </label>
              </div>
              {enabled && (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <div className="d-flex align-items-center gap-1">
                    <label className="form-label mb-0">MIN вес (кг)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm"
                      style={{ width: 110 }}
                      defaultValue="5"
                      {...register(`rigs.${idx}.minWeight` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <label className="form-label mb-0">Шаг (кг)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm"
                      style={{ width: 110 }}
                      defaultValue="2.5"
                      {...register(`rigs.${idx}.step` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <label className="form-label mb-0">MAX вес (кг)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm"
                      style={{ width: 110 }}
                      defaultValue="200"
                      {...register(`rigs.${idx}.maxWeight` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-success" disabled={submitting}>
          Сохранить
        </button>
      </div>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </form>
  );
}
