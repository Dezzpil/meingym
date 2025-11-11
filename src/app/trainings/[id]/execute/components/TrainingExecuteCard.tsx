"use client";

import React, { useCallback } from "react";
import {
  handleTrainingExercisePass,
  handleTrainingExerciseStart,
} from "@/app/trainings/[id]/execute/actions";
import {
  TrainingExercise,
  Action,
  TrainingExerciseExecution,
  ApproachesGroup,
  Purpose,
  TrainingRating,
} from "@prisma/client";
import { TrainingExecuteForm } from "@/app/trainings/[id]/execute/components/TrainingExecuteForm";
import { PurposeText } from "@/components/PurposeText";
import classNames from "classnames";
import { ActionWithMusclesType } from "@/app/actions/types";
import { TrainingExerciseReplaceButton } from "@/app/trainings/[id]/execute/components/TrainingExerciseReplaceButton";
import { FaExchangeAlt } from "react-icons/fa";
import { TiCancel } from "react-icons/ti";

type Props = {
  exercise: {
    id: number;
    trainingId: number;
    actionId: number;
    startedAt: Date | null;
    completedAt: Date | null;
    isPassed: boolean;
    rating: TrainingRating;
    comment: string | null;
    liftedSum: number;
    liftedMean: number;
    liftedMax: number;
    liftedCountTotal: number;
    liftedCountMean: number;
    purpose: Purpose;
  } & {
    Action: Action;
    ApproachGroup: ApproachesGroup;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
  allActions: ActionWithMusclesType[];
  allExercises: TrainingExercise[];
};
export function TrainingExecuteCard({
  exercise,
  disabled,
  allActions,
  allExercises,
}: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exercise.id, exercise.trainingId);
  }, [exercise]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exercise.id, exercise.trainingId);
  }, [exercise]);

  return (
    <div className="card mb-3" key={exercise.id}>
      <div className="card-header">
        <ul className="col-lg-6 col-md-12 list-inline mb-0">
          <li
            className={classNames("list-inline-item", {
              "fw-medium": exercise.startedAt && !exercise.completedAt,
            })}
          >
            {exercise.Action.alias
              ? exercise.Action.alias
              : exercise.Action.title}
          </li>
          <li className="list-inline-item">
            <PurposeText purpose={exercise.purpose} />
          </li>
        </ul>
        <div className="col-lg-6 col-md-12"></div>
      </div>
      <div className="card-body">
        {!disabled && (
          <div className="d-flex justify-content-between mb-2">
            <div className="d-flex gap-2">
              {!exercise.startedAt && (
                <button
                  className="btn btn-outline-warning d-inline-flex align-items-center"
                  onClick={pass}
                  title="Пропустить упражнение"
                >
                  Пропустить
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              {!exercise.completedAt && (
                <TrainingExerciseReplaceButton
                  exercise={exercise}
                  allExercises={allExercises}
                  actions={allActions}
                  disabled={disabled || exercise.completedAt !== null}
                />
              )}
              {!exercise.startedAt && (
                <button className="btn btn-primary" onClick={start}>
                  Погнали!
                </button>
              )}
            </div>
          </div>
        )}
        <TrainingExecuteForm
          exercise={exercise}
          disabled={!exercise.startedAt || !!exercise.completedAt || disabled}
        />
      </div>
    </div>
  );
}
