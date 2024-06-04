"use client";

import type {
  ApproachesGroup,
  Action,
  TrainingExercise,
  Approach,
  TrainingExerciseExecution,
} from "@prisma/client";
import Link from "next/link";
import { ApproachesManagement } from "@/components/approaches/Managment";
import React, { useCallback, useState } from "react";
import { FaX } from "react-icons/fa6";
import {
  handleChangeExercisePriority,
  handleDeleteExercise,
} from "@/app/trainings/exercises/actions";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { NumberDiffViz } from "@/components/NumberDiffViz";
import moment from "moment/moment";
import { PurposeText } from "@/components/PurposeText";

type Props = {
  exercise: TrainingExercise & {
    Action: Action;
    ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  canControl: boolean;
};

export default function TrainingExerciseItemControl({
  exercise,
  canControl,
}: Props) {
  const [hidden, setHidden] = useState<boolean>(true);
  const show = useCallback(() => {
    setHidden(false);
  }, []);
  const hide = useCallback(() => {
    setHidden(true);
  }, []);
  const remove = useCallback(async () => {
    await handleDeleteExercise(exercise.id);
  }, [exercise.id]);
  const up = useCallback(async () => {
    await handleChangeExercisePriority(exercise.id, true);
  }, [exercise.id]);
  const down = useCallback(async () => {
    await handleChangeExercisePriority(exercise.id, false);
  }, [exercise.id]);
  return (
    <div className="row">
      <div className="mb-3 col-md-3 col-sm-12">
        <div className="hstack gap-2 mb-2">
          <Link href={`/actions/${exercise.Action.id}`}>
            {exercise.Action.alias
              ? exercise.Action.alias
              : exercise.Action.title}
          </Link>
          <PurposeText purpose={exercise.purpose} />
        </div>
        <div className="d-flex gap-2">
          {exercise.ApproachGroup.Approaches.map((a) => (
            <span key={a.id}>
              {a.weight}x{a.count}
            </span>
          ))}
        </div>
        <div className="d-flex gap-3 mb-2 text-muted small">
          <span>Σ кг: {exercise.ApproachGroup.sum}</span>
          <span>÷ кг: {exercise.ApproachGroup.mean.toFixed(1)}</span>
          <span>Σ раз: {exercise.ApproachGroup.countTotal}</span>
          <span>
            ÷ раз:{" "}
            {(
              exercise.ApproachGroup.countTotal / exercise.ApproachGroup.count
            ).toFixed(1)}
          </span>
        </div>
        {canControl && (
          <div className="d-flex gap-2">
            {hidden ? (
              <button className="btn btn-sm btn-secondary" onClick={show}>
                Редактировать
              </button>
            ) : (
              <button className="btn btn-sm btn-dark" onClick={hide}>
                Скрыть редактирование
              </button>
            )}
            <button className="btn btn-sm btn-default" onClick={up}>
              <FaArrowUp />
            </button>
            <button className="btn btn-sm btn-default" onClick={down}>
              <FaArrowDown />
            </button>
            <button className="btn btn-sm btn-danger" onClick={remove}>
              <FaX />
            </button>
          </div>
        )}
        {exercise.completedAt && (
          <>
            <div className="hstack gap-2 mb-2">
              <span>Исполнение</span>
              <span className="text-muted">
                (+
                {moment(exercise.completedAt).diff(
                  moment(exercise.startedAt),
                  "minute",
                )}{" "}
                мин.)
              </span>
            </div>
            <div className="d-flex gap-2">
              {exercise.TrainingExerciseExecution.map((execution) => (
                <span key={execution.id}>
                  <NumberDiffViz
                    prev={execution.plannedWeigth}
                    current={execution.liftedWeight}
                    tooltip={false}
                  />
                  x
                  <NumberDiffViz
                    prev={execution.plannedCount}
                    current={execution.liftedCount}
                    toFixed={false}
                    tooltip={false}
                  />
                </span>
              ))}
            </div>
            <div className="d-flex gap-3 mb-2 text-muted small">
              <div className="hstack gap-1">
                <span>Σ кг:</span>
                <NumberDiffViz
                  prev={exercise.ApproachGroup.sum}
                  current={exercise.liftedSum}
                />
              </div>
              <div className="hstack gap-1">
                <span>÷ кг:</span>
                <NumberDiffViz
                  prev={exercise.ApproachGroup.mean}
                  current={exercise.liftedMean}
                />
              </div>
              <div className="hstack gap-1">
                <span>Σ раз:</span>
                <NumberDiffViz
                  prev={exercise.ApproachGroup.countTotal}
                  current={exercise.liftedCountTotal}
                  toFixed={false}
                />
              </div>
              <div className="hstack gap-1">
                <span>÷ раз:</span>
                <NumberDiffViz
                  prev={
                    exercise.ApproachGroup.countTotal /
                    exercise.ApproachGroup.count
                  }
                  current={
                    exercise.liftedCountTotal /
                    exercise.TrainingExerciseExecution.length
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="col-md-9 col-sm-12" hidden={hidden}>
        <ApproachesManagement
          update={{
            groupId: exercise.approachGroupId,
            trainingId: exercise.trainingId,
          }}
          approaches={exercise.ApproachGroup.Approaches}
          actionId={exercise.actionId}
        />
      </div>
    </div>
  );
}
