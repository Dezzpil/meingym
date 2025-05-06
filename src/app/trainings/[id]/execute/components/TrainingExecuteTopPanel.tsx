"use client";

import React, { useCallback } from "react";
import { handleTrainingStart } from "@/app/trainings/[id]/execute/actions";
import classNames from "classnames";
import moment from "moment/moment";
import type { Training } from "@prisma/client";
import { DateFormat, TimeFormat } from "@/tools/dates";
import { FaLongArrowAltRight } from "react-icons/fa";
import Link from "next/link";
import { TrainingCompleteInfo } from "@/app/trainings/components/TrainingCompleteInfo";

type Props = {
  training: Training;
};

export function TrainingExecuteTopPanel({ training }: Props) {
  const start = useCallback(async () => {
    await handleTrainingStart(training.id, training.isCircuit);
  }, [training]);

  return (
    <>
      <h4>Тренировка {moment(training.plannedTo).format(DateFormat)}</h4>
      {!training.startedAt && (
        <div className="alert alert-light d-flex justify-content-between align-items-center">
          <button className="btn btn-primary" onClick={start}>
            Начать тренировку
          </button>
          <Link
            className="btn btn-outline-secondary"
            href={`/trainings/${training.id}`}
          >
            Настроить
          </Link>
        </div>
      )}
      {training.startedAt && !training.completedAt && (
        <div className="alert alert-primary">
          <span>
            Тренировка начата в {moment(training.startedAt).format(TimeFormat)}!
          </span>
        </div>
      )}
      {training.completedAt && (
        <div className="alert alert-success">
          <TrainingCompleteInfo training={training} />
        </div>
      )}
    </>
  );
}
