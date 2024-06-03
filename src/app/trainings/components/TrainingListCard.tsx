"use client";

import type { Training, TrainingExercise } from "@prisma/client";
import Link from "next/link";
import moment from "moment/moment";
import {
  ActionPurposeCnt,
  MuscleGroupTitleToExercisesCnt,
} from "@/app/trainings/page";
import { useMemo } from "react";
import { DateFormat, TimeFormat } from "@/tools/dates";

function printPurposes(purposes?: string[]) {
  if (purposes) {
    let maxIndex = 0;
    for (let i = 0; i < purposes.length; i++) {
      maxIndex = purposes[i] > purposes[maxIndex] ? i : maxIndex;
    }
    return purposes.map((p) =>
      p === purposes[maxIndex] ? (
        <b key={p}>{p}%</b>
      ) : (
        <span key={p}>{p}%</span>
      ),
    );
  }
  return <span>&mdash;</span>;
}

type Props = {
  training: Training & { TrainingExercise: TrainingExercise[] };
  muscleGroupsCounts?: MuscleGroupTitleToExercisesCnt;
  purposeCounts?: ActionPurposeCnt;
};

export function TrainingListCard({
  training,
  muscleGroupsCounts,
  purposeCounts,
}: Props) {
  const muscleGroups = useMemo(() => {
    if (muscleGroupsCounts) {
      return Object.entries(muscleGroupsCounts).sort((a, b) => {
        return a[1] >= b[1] ? -1 : 1;
      });
    }
  }, [muscleGroupsCounts]);

  const purposes = useMemo(() => {
    const result = [];
    if (purposeCounts) {
      const len = training.TrainingExercise.length;
      const str = ((purposeCounts.STRENGTH / len) * 100).toFixed(1);
      const mass = ((purposeCounts.MASS / len) * 100).toFixed(1);
      const loss = ((purposeCounts.LOSS / len) * 100).toFixed(1);
      result.push(str, mass, loss);
      return result;
    }
  }, [purposeCounts, training.TrainingExercise.length]);

  return (
    <>
      <div className="card mb-2">
        <div className="card-header">
          Тренировка{" "}
          <Link href={`/trainings/${training.id}`}>
            {moment(training.plannedTo).format(DateFormat)}
          </Link>
        </div>
        <div className="card-body">
          <div className="mb-2">
            <b>Количество упражнений: </b>
            <span>{training.TrainingExercise.length}</span>
          </div>
          <ul className="list-inline mb-2">
            <li className="list-inline-item">
              <b>Упражнения по группам: </b>
            </li>
            {muscleGroups && muscleGroups.length ? (
              muscleGroups.map((entry) => (
                <li className="list-inline-item" key={entry[0]}>
                  {entry[0]}: {entry[1]}
                </li>
              ))
            ) : (
              <li className="list-inline-item">Не заданы</li>
            )}
          </ul>
          <abbr
            className="d-inline-flex gap-2 mb-2"
            title="На силу / на массу / на снижение веса"
          >
            <b>Цели: </b>
            {printPurposes(purposes)}
          </abbr>
          <div className="mb-2 hstack gap-2">
            {training.startedAt && (
              <>
                <span>
                  {moment(training.startedAt).format(
                    [DateFormat, TimeFormat].join(" "),
                  )}
                </span>
                <span>&nbsp;&mdash;&nbsp;</span>
              </>
            )}
            {training.completedAt ? (
              <span className="text-success">
                +
                {moment(training.completedAt).diff(
                  training.startedAt,
                  "minute",
                )}{" "}
                мин.
              </span>
            ) : (
              <span className="text-muted">...</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
