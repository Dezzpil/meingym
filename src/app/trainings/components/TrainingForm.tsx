"use client";

import { Equipment, Training } from "@prisma/client";
import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/types";
import { useState } from "react";
import { handleTrainingUpdate } from "@/app/trainings/[id]/actions";
import moment from "moment";
import { DeleteTrainingButton } from "@/app/trainings/components/DeleteTrainingButton";
import { BsThreeDots } from "react-icons/bs";

type Props = {
  training: Training;
  equipments: Equipment[];
};

export function TrainingForm({ training, equipments }: Props) {
  const form = useForm<TrainingFormFieldsType>({
    defaultValues: Object.assign(training, {
      plannedTo: moment(training.plannedTo).format("YYYY-MM-DD"),
    }),
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const [dateIsChanged, setDateIsChanged] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);
  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    const result = await handleTrainingUpdate(training.id, data, dateIsChanged);
    if (!result.ok) {
      setError(result.error);
    }
    setHandling(false);
  });

  const formId = `training-form-${training.id}`;

  return (
    <>
      <form id={formId} onSubmit={submit} className="mb-3">
        <div className="mb-2">
          <label className="form-label visually-hidden">Дата занятия</label>
          <input
            type="date"
            className="form-control"
            {...form.register("plannedTo", {
              required: true,
              valueAsDate: true,
              onChange: () => {
                setDateIsChanged(true);
              },
            })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label visually-hidden">
            Набор оборудования
          </label>
          <select
            className="form-select"
            defaultValue={
              training.equipmentId ? training.equipmentId : undefined
            }
            {...form.register("equipmentId", {
              required: true,
              valueAsNumber: true,
            })}
          >
            {equipments.map((g) => (
              <option value={g.id} key={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <textarea
            className="form-control"
            placeholder={"Комментарий..."}
            {...form.register("commonComment")}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end align-items-baseline column-gap-5 flex-wrap">
          <div className="form-check mb-2">
            <input
              type="checkbox"
              id="isCircuit"
              className="form-check-input"
              {...form.register("isCircuit")}
            />
            <label htmlFor="isCircuit" className="form-check-label">
              Свободная тренировка?
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              id="noWarmUp"
              className="form-check-input"
              {...form.register("noWarmUp")}
            />
            <label htmlFor="noWarmUp" className="form-check-label">
              Без разминки?
            </label>
          </div>
        </div>
      </form>

      <div className="mb-2 hstack justify-content-end gap-2">
        <button
          className="btn btn-outline-primary"
          disabled={handling}
          form={formId}
        >
          Сохранить
        </button>
        {!showMore ? (
          <button
            type="button"
            className="btn btn-outline-secondary"
            title="Доп. действия"
            onClick={() => setShowMore(true)}
          >
            <BsThreeDots />
          </button>
        ) : (
          <div className="hstack gap-2">
            <DeleteTrainingButton id={training.id} />
          </div>
        )}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
}
