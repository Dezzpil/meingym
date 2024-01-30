"use client";

import type {
  ApproachesGroup,
  Action,
  TrainingExercise,
  Approach,
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

type Props = {
  e: TrainingExercise & {
    Action: Action;
    ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  };
};

export default function ExerciseItemControl({ e }: Props) {
  const [hidden, setHidden] = useState<boolean>(true);
  const show = useCallback(() => {
    setHidden(false);
  }, []);
  const hide = useCallback(() => {
    setHidden(true);
  }, []);
  const remove = useCallback(async () => {
    await handleDeleteExercise(e.id);
  }, [e.id]);
  const up = useCallback(async () => {
    await handleChangeExercisePriority(e.id, true);
  }, [e.id]);
  const down = useCallback(async () => {
    await handleChangeExercisePriority(e.id, false);
  }, [e.id]);
  return (
    <div className="row">
      <div className="mb-3 col-md-3 col-sm-12">
        <Link href={`/actions/${e.Action.id}`}>
          {e.Action.alias ? e.Action.alias : e.Action.title}
        </Link>
        <div>
          <small className="small text-muted">{e.purpose}</small>
        </div>
        <div className="d-flex gap-2">
          {e.ApproachGroup.Approaches.map((a) => (
            <span key={a.id}>
              {a.weight}x{a.count}
            </span>
          ))}
        </div>
        <div className="d-flex gap-3 mb-2 text-muted small">
          <span>Σ кг: {e.ApproachGroup.sum}</span>
          <span>÷ кг: {e.ApproachGroup.mean.toFixed(2)}</span>
        </div>
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
      </div>
      <div className="col-md-9 col-sm-12" hidden={hidden}>
        <ApproachesManagement
          update={{ groupId: e.approachGroupId, trainingId: e.trainingId }}
          approaches={e.ApproachGroup.Approaches}
        />
      </div>
    </div>
  );
}
