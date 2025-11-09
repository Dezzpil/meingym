"use client";

import type {
  Action,
  Muscle,
  ActionsOnMusclesAgony,
  ActionsOnMusclesSynergy,
  ActionsOnMusclesStabilizer,
  ExerciseImage,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { useState, useMemo } from "react";
import { handleUpdate } from "@/app/actions/actions";
import { ActionRig } from "@prisma/client";
import { Toaster } from "react-hot-toast";
import { ActionFormMuscleMultiSelect } from "@/app/actions/components/form/ActionFormMuscleMultiSelect";
import { ActionImagesSection } from "@/app/actions/components/ActionImagesSection";
import { ActionFormSimilarActionsMultiSelect } from "@/app/actions/components/form/ActionFormSimilarActionsMultiSelect";
import styles from "@/app/actions/muscles.module.css";
import {
  MuscleAgonyBackground,
  MuscleStabilizerBackground,
  MuscleSynergyBackground,
} from "@/app/actions/colors";

type Props = {
  muscles: Array<Muscle & { Group: { title: string } }>;
  action: Action & {
    MusclesSynergy: ActionsOnMusclesAgony[];
    MusclesAgony: ActionsOnMusclesSynergy[];
    MusclesStabilizer: ActionsOnMusclesStabilizer[];
    ExerciseImages?: ExerciseImage[];
    SimilarTo?: {
      actionId: number;
      similarActionId: number;
    }[];
    SimilarFrom?: {
      actionId: number;
      similarActionId: number;
    }[];
  };
  allowedSimilarActions?: { id: number; title: string }[];
  control?: boolean;
};

export default function ActionForm({
  muscles,
  action,
  allowedSimilarActions = [],
  control,
}: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);

  // надо объединить id указанных аналогичных упражнений в similarExerciseIds
  const actionWithMergedSimilarActions = useMemo(() => {
    const similarExerciseIds = new Set<string>();
    if (action.SimilarTo)
      action.SimilarTo.forEach((s) => similarExerciseIds.add(s.actionId + ""));
    if (action.SimilarFrom)
      action.SimilarFrom.forEach((s) =>
        similarExerciseIds.add(s.similarActionId + ""),
      );

    const musclesAgonyIds = (action.MusclesAgony || []).map((m: any) =>
      String(m.muscleId),
    );
    const musclesSynergyIds = (action.MusclesSynergy || []).map((m: any) =>
      String(m.muscleId),
    );
    const musclesStabilizerIds = (action.MusclesStabilizer || []).map(
      (m: any) => String(m.muscleId),
    );

    return Object.assign({}, action, {
      similarExerciseIds: Array.from(similarExerciseIds.values()),
      musclesAgonyIds,
      musclesSynergyIds,
      musclesStabilizerIds,
    });
  }, [action]);

  const form = useForm<ActionsFormFieldsType>({
    defaultValues: actionWithMergedSimilarActions as any,
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
      <Toaster position="top-right" />
      {!actionWithMergedSimilarActions && <span>Загрузка...</span>}
      {actionWithMergedSimilarActions && (
        <form onSubmit={onSubmit} className="form row">
          <div className="col-sm-12 col-lg-6">
            <div className="mb-3">
              <label className="form-label">Название</label>
              <input
                className="form-control"
                {...form.register("title", { required: true })}
              />
            </div>
            <div className="mb-3">
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
            </div>
            <div className="mb-3">
              <label className="form-label">Сокращенное название</label>
              <input
                className="form-control"
                {...form.register("alias", { required: false })}
              />
            </div>
          </div>

          <div className="col-sm-12 col-lg-6 muscles-container">
            <ActionFormMuscleMultiSelect
              name={"musclesAgonyIds"}
              label={"Мышцы-агонисты"}
              muscles={muscles as any}
              control={form.control}
              isDisabled={!control}
              muscleClassBorderColor={MuscleAgonyBackground}
            />
            <ActionFormMuscleMultiSelect
              name={"musclesSynergyIds"}
              label={"Мышцы-синергисты"}
              muscles={muscles as any}
              control={form.control}
              isDisabled={!control}
              muscleClassBorderColor={MuscleSynergyBackground}
            />
            <ActionFormMuscleMultiSelect
              name={"musclesStabilizerIds"}
              label={"Мышцы-стабилизаторы"}
              muscles={muscles as any}
              control={form.control}
              isDisabled={!control}
              muscleClassBorderColor={MuscleStabilizerBackground}
            />
          </div>

          <div className="col-lg-12">
            <div className="mb-3">
              <label className="form-label">Параметры</label>
              <div className="row row-cols-lg-auto g-3 align-items-center">
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="strengthAllowed"
                      className="form-check-input"
                      {...form.register("strengthAllowed", {})}
                    />
                    <label
                      htmlFor="strengthAllowed"
                      className="form-check-label"
                    >
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
            </div>

            <div className="mb-3">
              <label className="form-label">Другие названия</label>
              <textarea
                className="form-control"
                {...form.register("anotherTitles", { required: false })}
              />
            </div>

            <ActionFormSimilarActionsMultiSelect
              name={"similarExerciseIds"}
              label={"Аналогичные упражнения"}
              options={allowedSimilarActions as any}
              control={form.control}
              isDisabled={!control}
            />

            <ActionImagesSection
              actionId={action.id}
              control={control}
              initialImages={action.ExerciseImages}
            />

            <div className="mb-3">
              <label className="form-label">Описание</label>
              <textarea
                rows={10}
                className="form-control"
                {...form.register("desc", { required: false })}
              />
            </div>

            {control && (
              <>
                <div className="mb-3 d-flex justify-content-end align-items-baseline gap-3">
                  <button className="btn btn-success" disabled={handling}>
                    Сохранить
                  </button>
                </div>
                {error && (
                  <div className="mb-3 alert alert-danger">{error}</div>
                )}
              </>
            )}
          </div>
        </form>
      )}
    </>
  );
}
