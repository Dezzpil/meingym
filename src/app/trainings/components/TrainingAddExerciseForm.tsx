"use client";

import type { Action, Training, TrainingExercise } from "@prisma/client";
import { Purpose } from "@prisma/client";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { useForm } from "react-hook-form";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { BiPlus } from "react-icons/bi";
import React, { useCallback, useMemo, useState } from "react";
import { CurrentPurpose } from "@/core/types";

type Props = {
  training: Training;
  actions: Action[];
  exercises: TrainingExercise[];
  defaultPurpose: CurrentPurpose;
};

export default function TrainingAddExerciseForm({
  training,
  actions,
  exercises,
  defaultPurpose,
}: Props) {
  const exercisesMap = useMemo(() => {
    return Object.fromEntries(exercises.map((e) => [e.actionId, true]));
  }, [exercises]);
  const actionsTitlesMap = useMemo(() => {
    return Object.fromEntries(
      actions.map((a) => [a.alias ? a.alias : a.title, a]),
    );
  }, [actions]);
  const filteredActions = useMemo(() => {
    return actions.filter((a) => !(a.id in exercisesMap));
  }, [actions, exercisesMap]);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ExerciseAddFieldsType>({
    defaultValues: {
      purpose: defaultPurpose,
    },
  });
  const submit = form.handleSubmit(async (data) => {
    data.actionId = actionsTitlesMap[data.actionTitle as string].id;
    setError(null);
    const result = await handleAddExercise(training.id, data);
    if (result && !result.ok) {
      setError(result.error);
    } else {
      form.reset();
    }
  });

  const [action, setAction] = useState<Action | null>(null);
  const chooseAction = useCallback(
    (e: any) => {
      const elem = e.target;
      if (elem.value in actionsTitlesMap) {
        setAction(actionsTitlesMap[elem.value]);
      }
    },
    [actionsTitlesMap],
  );

  return actions.length > exercises.length ? (
    <>
      <form className="mb-3 d-flex gap-2" onSubmit={submit}>
        {filteredActions.length && (
          <div>
            <select
              className="form-control"
              {...form.register("actionTitle")}
              onChange={chooseAction}
            >
              {filteredActions.map((a) => (
                <option value={a.alias ? a.alias : a.title} key={a.id}>
                  {a.alias ? a.alias : a.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <select className="form-control" {...form.register("purpose")}>
            {action && action.strengthAllowed && (
              <option value={Purpose.STRENGTH}>На силу</option>
            )}
            <option value={Purpose.MASS}>На массу</option>
            <option value={Purpose.LOSS}>На снижение веса</option>
          </select>
        </div>
        <div className="">
          <button className="btn btn-primary">
            <BiPlus />
          </button>
        </div>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  ) : null;
}
