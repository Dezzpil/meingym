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
import { GrCompare } from "react-icons/gr";
import {
  handleChangeExercisePriority,
  handleDeleteExercise,
} from "@/app/trainings/exercises/actions";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { NumberDiffViz } from "@/components/NumberDiffViz";
import moment from "moment/moment";
import { PurposeText } from "@/components/PurposeText";
import {
  SetsStatsBase,
  SetsStatsForApproachGroup,
  SetsStatsForExecutedExercise,
} from "@/components/SetsStats";
import { TrainingRatingEmoji } from "@/app/trainings/components/TrainingRatingEmoji";
import { ActionLastScores } from "@/app/actions/components/ActionLastScores";
import { SetsStats } from "@/core/types";

type Props = {
  exercise: (TrainingExercise & {
    Action: Action;
    ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
    TrainingExerciseExecution: TrainingExerciseExecution[];
  }) & { prevSetsStats?: SetsStats | null };
  canControl: boolean;
};

export default function TrainingExerciseItemControl({
  exercise,
  canControl,
}: Props) {
  const [hidden, setHidden] = useState<boolean>(true);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const toggleCompare = useCallback(() => setShowCompare((v) => !v), []);
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
        <div className="mb-2">
          <Link href={`/actions/${exercise.Action.id}/history`}>
            {exercise.Action.alias
              ? exercise.Action.alias
              : exercise.Action.title}
          </Link>{" "}
          <PurposeText purpose={exercise.purpose} />
        </div>
        <div className="d-flex column-gap-2 flex-wrap mb-1">
          {exercise.ApproachGroup.Approaches.map((a) => (
            <div key={a.id}>
              <NumberDiffViz current={a.weight} tooltip={false} />
              x
              <NumberDiffViz
                current={a.count}
                toFixed={false}
                tooltip={false}
              />
            </div>
          ))}
        </div>
        <SetsStatsForApproachGroup
          group={exercise.ApproachGroup}
          prev={exercise.prevSetsStats ?? undefined}
          className="mb-2"
        />
        {showCompare && (
          <div className="mb-2">
            {exercise.prevSetsStats ? (
              <SetsStatsBase current={exercise.prevSetsStats} className="mb-2" />
            ) : (
              <div className="text-muted small">Нет данных для сравнения</div>
            )}
          </div>
        )}
        {canControl && (
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${
                showCompare ? "btn-primary" : "btn-default"
              }`}
              onClick={toggleCompare}
              title="Сравнить с предыдущими"
            >
              <GrCompare />
            </button>
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
              <TrainingRatingEmoji rating={exercise.rating} />
            </div>
            <div className="d-flex column-gap-2 flex-wrap mb-1">
              {exercise.TrainingExerciseExecution.map((execution) => (
                <div key={execution.id}>
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
                </div>
              ))}
            </div>
            <SetsStatsForExecutedExercise
              exercise={exercise as any}
              className="mb-2"
            />
            {exercise.comment && (
              <div className="text-muted small mb-2">
                <span>{exercise.comment}</span>
              </div>
            )}
            <ActionLastScores exerciseId={exercise.id} />
          </>
        )}
      </div>

      <div className="col-md-9 col-sm-12" hidden={hidden}>
        <ApproachesManagement
          update={{
            groupId: exercise.approachGroupId,
            trainingId: exercise.trainingId,
          }}
          approachGroup={exercise.ApproachGroup}
          actionId={exercise.actionId}
        />
      </div>
    </div>
  );
}
