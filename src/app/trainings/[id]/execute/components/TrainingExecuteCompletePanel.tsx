"use client";
import type { Training } from "@prisma/client";
import React, { useCallback, useState } from "react";
import moment from "moment";
import { TrainingRepeatForm } from "@/app/trainings/[id]/execute/components/TrainingRepeatForm";
import { TrainingProcessPanel } from "@/app/trainings/[id]/execute/components/TrainingProcessPanel";
import { handleCompleteTrainingManually } from "@/app/trainings/[id]/execute/actions";
import Link from "next/link";

type Props = {
  training: Training;
};
export function TrainingExecuteCompletePanel({ training }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
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
    <div className="alert alert-light d-flex gap-5 justify-content-between align-items-baseline">
      {training.completedAt ? (
        <>
          <div className="hstack gap-2">
            <span>
              Завершена в {moment(training.completedAt).format("H:mm")} (+
              {moment(training.completedAt).diff(
                moment(training.startedAt),
                "minute",
              )}{" "}
              мин.)!
            </span>
            <Link href={`/trainings/${training.id}`}>Подробнее...</Link>
          </div>

          {training.processedAt ? (
            <TrainingRepeatForm training={training} />
          ) : (
            <TrainingProcessPanel training={training} />
          )}
        </>
      ) : (
        <div>
          <button
            className="btn btn-warning"
            disabled={handling}
            onClick={handle}
          >
            Завершить
          </button>
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
      )}
    </div>
  );
}
