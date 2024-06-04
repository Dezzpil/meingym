"use client";

import React, { useCallback } from "react";
import { handleTrainingStart } from "@/app/trainings/[id]/execute/actions";
import classNames from "classnames";
import moment from "moment/moment";
import type { Training } from "@prisma/client";
import { DateFormat } from "@/tools/dates";

type Props = {
  training: Training;
};

export function TrainingExecuteTopPanel({ training }: Props) {
  const start = useCallback(async () => {
    await handleTrainingStart(training.id);
  }, [training]);

  return (
    <>
      <h4>
        Выполнение тренировки {moment(training.plannedTo).format(DateFormat)}
      </h4>
      <div
        className={classNames("alert", {
          "alert-light": !training.startedAt,
          "alert-primary": training.startedAt,
          "alert-success": training.completedAt,
        })}
        role="alert"
      >
        <div className="d-flex align-items-baseline justify-content-between">
          {training.startedAt ? (
            <span>
              Тренировка начата в {moment(training.startedAt).format("HH:mm")}!
            </span>
          ) : (
            <>
              <span>Тренировка еще не начата!</span>
              <button className="btn btn-primary" onClick={start}>
                Начать
              </button>
            </>
          )}
        </div>
        {training.completedAt && (
          <div className="d-flex align-items-baseline justify-content-between">
            Тренировка завершена в {moment(training.completedAt).format("H:mm")}{" "}
            (+
            {moment(training.completedAt).diff(
              moment(training.startedAt),
              "minute",
            )}{" "}
            мин.)!
          </div>
        )}
      </div>
    </>
  );
}
