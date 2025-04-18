import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { TrainingAddExerciseForm } from "@/app/trainings/components/TrainingAddExerciseForm";
import React from "react";
import TrainingExerciseItemControl from "@/app/trainings/components/TrainingExerciseItemControl";
import type { Training } from "@prisma/client";
import moment from "moment";
import { TrainingRepeatForm } from "@/app/trainings/[id]/execute/components/TrainingRepeatForm";
import { TrainingProcessPanel } from "@/app/trainings/[id]/execute/components/TrainingProcessPanel";
import { DateFormat, TimeFormat } from "@/tools/dates";
import Link from "next/link";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import classNames from "classnames";
import { TrainingForm } from "@/app/trainings/components/TrainingForm";
import { NameOfTheDay } from "@/components/NameOfTheDay";
import { FaLongArrowAltRight } from "react-icons/fa";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const training = (await prisma.training.findUniqueOrThrow({
    where: { id },
  })) as Training;
  const userId = await getCurrentUserId();
  const userInfo = await findUserInfo(userId);
  const actions = await prisma.action.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
    },
  });
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
        <h3 className="hstack gap-2">
          <span>
            Тренировка {moment(training.plannedTo).format(DateFormat)}
          </span>
          <NameOfTheDay date={training.plannedTo} />
        </h3>
        {!training.startedAt && (
          <>
            <div>
              <TrainingForm training={training} />
            </div>
          </>
        )}
      </header>
      {training.startedAt && (
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
              Тренировка начата в{" "}
              {moment(training.startedAt).format(TimeFormat)}!
            </span>
          )}
        </div>
      )}
      {exercises.length ? (
        <>
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
          <div className="alert alert-light d-inline-flex gap-3">
            <b>Оценка времени выполнения упражнений:</b>
            <span>
              {training.timeScoreInMins
                ? training.timeScoreInMins.toFixed(2)
                : 0}{" "}
              мин.
            </span>
            {training.timeScoreInSecs && (
              <span className={"text-muted"}>
                {training.timeScoreInSecs} в сек.
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="alert alert-warning">
          Упражнения еще не добавлены...
        </div>
      )}
      {!training.completedAt && (
        <TrainingAddExerciseForm
          training={training}
          actions={actions}
          exercises={exercises}
          defaultPurpose={userInfo.purpose}
        />
      )}
      <div className="d-flex gap-3 mb-3">
        {moment(training.plannedTo).isSame(moment(), "day") && (
          <div className="mb-3">
            <Link
              className="btn btn-outline-secondary"
              href={`/trainings/${training.id}/execute`}
            >
              Перейти к выполнению
            </Link>
          </div>
        )}
        {training.completedAt && !training.processedAt && (
          <TrainingProcessPanel training={training} />
        )}
        {training.processedAt && <TrainingRepeatForm training={training} />}
      </div>
    </>
  );
}
