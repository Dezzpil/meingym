import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import TrainingAddExerciseForm from "@/app/trainings/components/TrainingAddExerciseForm";
import React from "react";
import TrainingExerciseItemControl from "@/app/trainings/components/TrainingExerciseItemControl";
import type { Training } from "@prisma/client";
import moment from "moment";
import { TrainingChangeDateForm } from "@/app/trainings/[id]/execute/components/TrainingChangeDateForm";
import { TrainingRepeatForm } from "@/app/trainings/[id]/execute/components/TrainingRepeatForm";
import { TrainingProcessPanel } from "@/app/trainings/[id]/execute/components/TrainingProcessPanel";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const training = (await prisma.training.findUniqueOrThrow({
    where: { id },
  })) as Training;
  const actions = await prisma.action.findMany({});
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
    include: {
      Action: true,
      ApproachGroup: {
        include: {
          Approaches: { orderBy: { priority: "asc" } },
        },
      },
      TrainingExerciseExecution: true,
    },
    orderBy: { priority: "asc" },
  });
  return (
    <>
      <header className="mb-3">
        <h3>Тренировка {moment(training.plannedTo).format("Y-MM-DD")}</h3>
        {!training.startedAt && (
          <div>
            <TrainingChangeDateForm training={training} />
          </div>
        )}
      </header>
      {training.startedAt && (
        <div className="alert alert-primary">
          {training.startedAt && (
            <div>
              Тренировка начата в {moment(training.startedAt).format("H:mm")}
            </div>
          )}
          {training.completedAt && (
            <div>
              Тренировка завершена через{" "}
              {moment(training.completedAt).diff(
                moment(training.startedAt),
                "minute",
              )}{" "}
              минуты
            </div>
          )}
        </div>
      )}
      {exercises.length ? (
        <ul className="list-group mb-3">
          {exercises.map((e) => (
            <li className="list-group-item mb-3" key={e.id}>
              <TrainingExerciseItemControl
                exercise={e}
                canControl={!training.startedAt}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>Упражнения еще не добавлены...</p>
      )}
      {!training.startedAt && (
        <TrainingAddExerciseForm training={training} actions={actions} />
      )}
      <div className="d-flex gap-3">
        {(moment(training.plannedTo).isSame(moment(), "day") ||
          training.startedAt) && (
          <a
            href={`/trainings/${training.id}/execute`}
            className="btn btn-light"
          >
            Выполнение
          </a>
        )}
        {training.completedAt && !training.processedAt && (
          <TrainingProcessPanel training={training} />
        )}
        {training.processedAt && <TrainingRepeatForm training={training} />}
      </div>
    </>
  );
}
