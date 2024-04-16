"use client";

import type { Training, TrainingExercise } from "@prisma/client";
import Link from "next/link";
import moment from "moment/moment";
import { MuscleGroupTitleToExercisesCnt } from "@/app/trainings/page";

type Props = {
  training: Training & { TrainingExercise: TrainingExercise[] };
  muscleGroupsCounts?: MuscleGroupTitleToExercisesCnt;
};

export function TrainingListItem({ training, muscleGroupsCounts }: Props) {
  return (
    <tr>
      <td>{training.id}</td>
      <td>
        <Link href={`/trainings/${training.id}`}>
          {moment(training.plannedTo).format("Y-M-D")}
        </Link>
      </td>
      <td>{training.TrainingExercise.length}</td>
      <td className="d-flex gap-2">
        {muscleGroupsCounts ? (
          Object.entries(muscleGroupsCounts).map((entry) => (
            <span key={entry[0]}>
              {entry[0]}: {entry[1]}
            </span>
          ))
        ) : (
          <span>&mdash;</span>
        )}
      </td>
      <td></td>
      <td>
        {training.startedAt && (
          <>
            <span>{moment(training.startedAt).format("Y-M-D H:mm")}</span>
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
