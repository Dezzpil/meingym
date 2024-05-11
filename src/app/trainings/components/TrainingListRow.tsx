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
  return purposes ? (
    <span>
      {purposes[0] > purposes[1] && (
        <>
          <b>{purposes[0]}</b> / {purposes[1]} %
        </>
      )}
      {purposes[0] < purposes[1] && (
        <>
          {purposes[0]} / <b>{purposes[1]}</b> %
        </>
      )}
      {purposes[0] == purposes[1] && (
        <>
          {purposes[0]} / {purposes[1]} %
        </>
      )}
    </span>
  ) : (
    <span>&mdash;</span>
  );
}

type Props = {
  training: Training & { TrainingExercise: TrainingExercise[] };
  muscleGroupsCounts?: MuscleGroupTitleToExercisesCnt;
  purposeCounts?: ActionPurposeCnt;
};

export function TrainingListRow({
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
      result.push(str, mass);
      return result;
    }
  }, [purposeCounts, training.TrainingExercise.length]);

  return (
    <tr>
      <td>{training.id}</td>
      <td>
        <Link href={`/trainings/${training.id}`}>
          {moment(training.plannedTo).format(DateFormat)}
        </Link>
      </td>
      <td>{training.TrainingExercise.length}</td>
      <td className="d-flex gap-2">
        {muscleGroups && muscleGroups.length ? (
          muscleGroups.map((entry) => (
            <span key={entry[0]}>
              {entry[0]}: {entry[1]}
            </span>
          ))
        ) : (
          <span>&mdash;</span>
        )}
      </td>
      <td>{printPurposes(purposes)}</td>
      <td>
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
            +{moment(training.completedAt).diff(training.startedAt, "minute")}{" "}
            мин.
          </span>
        ) : (
          <span className="text-muted">...</span>
        )}
      </td>
    </tr>
  );
}
