"use client";

import type { Action, Training, TrainingExercise } from "@prisma/client";
import { Purpose } from "@prisma/client";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { useForm } from "react-hook-form";
import { ExerciseAddFieldsType } from "@/app/trainings/exercises/types";
import { BiPlus } from "react-icons/bi";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { CurrentPurpose } from "@/core/types";
import { FiSearch } from "react-icons/fi";
import Modal from "react-bootstrap/Modal";
import { TrainingExerciseSearch } from "@/app/trainings/components/TrainingExerciseSearch";
import { ActionWithMusclesType } from "@/app/actions/types";
import { getActionName } from "@/tools/action";

type Props = {
  training: Training;
  actions: ActionWithMusclesType[];
  exercises: TrainingExercise[];
  defaultPurpose: CurrentPurpose;
};

export function TrainingAddExerciseForm({
  training,
  actions,
  exercises,
  defaultPurpose,
}: Props) {
  const exercisesMap = useMemo(() => {
    return Object.fromEntries(exercises.map((e) => [e.actionId, true]));
  }, [exercises]);
  const actionsTitlesMap = useMemo(() => {
    return Object.fromEntries(actions.map((a) => [getActionName(a), a]));
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
    console.log(data);
    if (!data.actionTitle) {
      setError(`Выберите движение`);
      return;
    }
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
      let action;
      const elem = e.target;
      if (elem instanceof HTMLAnchorElement) {
        const item = elem.dataset["name"] as string;
        if (item in actionsTitlesMap) {
          action = actionsTitlesMap[item];
          setAction(action);
        }
      } else {
        console.log(elem, elem.value);
        if (elem.value in actionsTitlesMap) {
          action = actionsTitlesMap[elem.value];
          if (action) setAction(action);

          form.setValue("actionTitle", getActionName(action));
          form.setValue("actionId", action.id);
          if (
            action &&
            action.strengthAllowed &&
            defaultPurpose === Purpose.STRENGTH
          ) {
            form.setValue("purpose", Purpose.STRENGTH);
          }
        }
      }
      return action;
    },
    [actionsTitlesMap],
  );

  const actionRef = useRef<HTMLSelectElement>(null);

  const [isShowed, setShowed] = useState<boolean>(false);
  const show = useCallback(() => {
    setShowed(true);
  }, []);
  const hide = useCallback(() => {
    setShowed(false);
  }, []);
  const selectAction = useCallback(
    (e: any) => {
      const chosenAction = chooseAction(e);
      if (chosenAction && actionRef.current) {
        actionRef.current.value = getActionName(chosenAction);
        form.setValue("actionTitle", getActionName(chosenAction));
        form.setValue("actionId", chosenAction.id);
        if (
          chosenAction.strengthAllowed &&
          defaultPurpose === Purpose.STRENGTH
        ) {
          form.setValue("purpose", Purpose.STRENGTH);
        }
      }
      setShowed(false);
    },
    [chooseAction], // no action for stop cycle
  );

  return filteredActions.length ? (
    <div className="mb-3">
      <form className="mb-2" onSubmit={submit}>
        <div className="col-sm-12 col-md-6 d-flex gap-2 mb-2">
          <select
            className="form-control"
            {...form.register("actionTitle")}
            onChange={chooseAction}
            ref={actionRef}
            defaultValue={""}
          >
            <option value="">-</option>
            {filteredActions.map((a) => (
              <option value={getActionName(a)} key={a.id}>
                {getActionName(a)}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={show}
          >
            <FiSearch />
          </button>
        </div>
        <div className="col-sm-12 col-md-6 d-flex gap-2">
          <select className="form-control" {...form.register("purpose")}>
            {action && action.strengthAllowed && (
              <option value={Purpose.STRENGTH}>На силу</option>
            )}
            <option value={Purpose.MASS}>На массу</option>
            <option value={Purpose.LOSS}>На снижение веса</option>
          </select>
          <button className="btn btn-primary">
            <BiPlus />
          </button>
        </div>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
      <Modal show={isShowed} onHide={hide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Поиск упражнения</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TrainingExerciseSearch
            baseActions={actions}
            onClick={selectAction}
          />
        </Modal.Body>
      </Modal>
    </div>
  ) : (
    <span>Не осталось движений для добавления</span>
  );
}
