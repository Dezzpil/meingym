"use client";

import React, { useCallback } from "react";
import { handleTrainingStart } from "@/app/trainings/[id]/execute/actions";
import classNames from "classnames";
import moment from "moment/moment";
import type { Training } from "@prisma/client";
import { DateFormat, TimeFormat } from "@/tools/dates";
import { FaLongArrowAltRight } from "react-icons/fa";

type Props = {
  training: Training;
};

export function TrainingExecuteTopPanel({ training }: Props) {
  const start = useCallback(async () => {
    await handleTrainingStart(training.id, training.isCircuit);
  }, [training]);

  return (
    <>
      <h4>
        Выполнение тренировки {moment(training.plannedTo).format(DateFormat)}
      </h4>
      <div
        className={classNames(
          "alert",
          {
            "alert-light": !training.startedAt,
            "alert-primary": training.startedAt,
            "alert-success": training.completedAt,
          },
          "d-flex align-items-center gap-2",
        )}
        role="alert"
      >
        {training.completedAt && (
          <>
            <span>{moment(training.startedAt).format(TimeFormat)}</span>
            <FaLongArrowAltRight />
            <span>{moment(training.completedAt).format(TimeFormat)}</span>
            <span>
              (+
              {moment(training.completedAt).diff(
                moment(training.startedAt),
                "minute",
              )}{" "}
              мин.)
            </span>
          </>
        )}
        {training.startedAt && !training.completedAt && (
          <span>
            Тренировка начата в {moment(training.startedAt).format(TimeFormat)}!
          </span>
        )}
        {!training.startedAt && (
          <button className="btn btn-primary" onClick={start}>
            Начать тренировку
          </button>
        )}
      </div>
    </>
  );
}
