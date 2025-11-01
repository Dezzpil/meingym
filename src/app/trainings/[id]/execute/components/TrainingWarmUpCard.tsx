"use client";

import React, { useCallback, useMemo } from "react";
import {
  handleTrainingWarmUpComplete,
  handleTrainingWarmUpSkip,
} from "@/app/trainings/[id]/execute/actions";
import classNames from "classnames";
import { Training, TrainingWarmUp } from "@prisma/client";
import moment from "moment";

type Props = {
  warmUp: TrainingWarmUp;
  disabled: boolean; // global disabled (not started or completed)
};

export function TrainingWarmUpCard({ warmUp, disabled }: Props) {
  const skip = useCallback(async () => {
    await handleTrainingWarmUpSkip(warmUp.trainingId);
  }, [warmUp]);

  const complete = useCallback(async () => {
    await handleTrainingWarmUpComplete(warmUp.trainingId, warmUp.startedAt!);
  }, [warmUp]);

  const isDone = useMemo(() => {
    if (warmUp.isSkipped || warmUp.completedAt) return true;
  }, [warmUp]);

  return (
    <div className="card mb-3">
      <div className="card-header">
        <ul className="col-lg-6 col-md-12 list-inline mb-0">
          <li
            className={classNames("list-inline-item", { "fw-medium": !isDone })}
          >
            Разминка
          </li>
        </ul>
      </div>
      <div className="card-body">
        {!disabled && !isDone && (
          <div className="d-flex justify-content-between mb-2">
            <button className="btn btn-outline-warning me-2" onClick={skip}>
              Пропустить
            </button>
            <button className="btn btn-outline-success" onClick={complete}>
              Закончили!
            </button>
          </div>
        )}
        {isDone && (
          <div className="d-flex gap-2">
            {warmUp.isSkipped && <span>Пропущена</span>}
            {warmUp.completedAt && (
              <>
                <span>Выполнена</span>
                <span className="text-muted">
                  (+
                  {moment(warmUp.completedAt).diff(
                    moment(warmUp.startedAt),
                    "minute",
                  )}{" "}
                  мин.)
                </span>
              </>
            )}
          </div>
        )}
        {!isDone && disabled && (
          <span>
            Доступ к упражнениям будет открыт после завершения или пропуска
            разминки.
          </span>
        )}
      </div>
    </div>
  );
}
