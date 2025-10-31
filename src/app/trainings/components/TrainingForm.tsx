"use client";

import { Training } from "@prisma/client";
import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/types";
import { useState } from "react";
import { handleTrainingUpdate } from "@/app/trainings/[id]/actions";
import moment from "moment";
import { DeleteTrainingButton } from "@/app/trainings/components/DeleteTrainingButton";
import { BsThreeDots } from "react-icons/bs";

type Props = {
  training: Training;
};

export function TrainingForm({ training }: Props) {
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
      <form id={formId} onSubmit={submit}>
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
          <textarea
            className="form-control"
            placeholder={"Комментарий..."}
            {...form.register("commonComment")}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end">
          <div className="form-check mb-2">
            <input
              type="checkbox"
              id="isCircuit"
              className="form-check-input"
              {...form.register("isCircuit")}
            />
            <label htmlFor="isCircuit" className="form-check-label">
              Круговая тренировка?
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
