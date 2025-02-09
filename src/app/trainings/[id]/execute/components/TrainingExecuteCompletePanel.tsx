"use client";
import type { Training } from "@prisma/client";
import React, {useCallback, useEffect, useState} from "react";
import moment from "moment";
import { TrainingRepeatForm } from "@/app/trainings/[id]/execute/components/TrainingRepeatForm";
import { TrainingProcessPanel } from "@/app/trainings/[id]/execute/components/TrainingProcessPanel";
import { handleCompleteTrainingManually } from "@/app/trainings/[id]/execute/actions";
import Link from "next/link";
import { TimeFormat } from "@/tools/dates";
import Confetti from "react-dom-confetti";
import {ConfettiConfig} from "dom-confetti";

const ConfettiConfig1: ConfettiConfig = {
  elementCount: 75,
  duration: 3000,
  angle: 75,
  spread: 15
};
const ConfettiConfig2: ConfettiConfig = {
  elementCount: 75,
  duration: 3000,
  angle: 105,
  spread: 15
};

type Props = {
  training: Training;
};
export function TrainingExecuteCompletePanel({ training }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const [isConfettiActive, setConfettiActive] = useState(false);
  useEffect(() => {
    if (training.completedAt) {
      setConfettiActive(true);
      setTimeout(() => {
        setConfettiActive(false);
      }, 3000);
    }
  }, [training.completedAt]);
  const handle = useCallback(async () => {
    setHandling(true);
    setError(null);
    try {
        await handleCompleteTrainingManually(training.id);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setHandling(false);
      }
  }, [training.id]);
  return (
    <div className="alert alert-light">
      {training.completedAt && (
        <p>
          <span>
            Завершена в {moment(training.completedAt).format(TimeFormat)} (+
            {moment(training.completedAt).diff(
              moment(training.startedAt),
              "minute",
            )}{" "}
            мин.)
          </span>
          <span>&nbsp;</span>
          <Link href={`/trainings/${training.id}`}>Подробнее...</Link>
        </p>
      )}
      <div className="flex-row d-flex gap-3 justify-content-end align-items-center">
        <Confetti active={ isConfettiActive } config={ConfettiConfig1} />
        <div className='flex-fill d-flex gap-3 justify-content-end align-items-center'>
        {training.completedAt ? (
          <>
            <button className="btn btn-default" onClick={() => { setConfettiActive(true); }}>Ура!</button>
            {training.processedAt ? (
              <TrainingRepeatForm training={training} />
            ) : (
              <TrainingProcessPanel training={training} />
            )}
          </>
        ) : (
          <>
            <div className="d-flex gap-3 justify-content-between">
              <button
                className="btn btn-warning"
                disabled={handling}
                onClick={handle}
              >
                Завершить
              </button>
              <Link
                className="btn btn-outline-secondary"
                href={`/trainings/${training.id}`}
              >
                Настроить
              </Link>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
          </>
        )}
        </div>
        <Confetti active={ isConfettiActive } config={ConfettiConfig2} />
      </div>
    </div>
  );
}
