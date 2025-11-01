import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { TrainingAddExerciseForm } from "@/app/trainings/components/TrainingAddExerciseForm";
import React from "react";
import TrainingExerciseItemControl from "@/app/trainings/components/TrainingExerciseItemControl";
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
import { TrainingTimeScore } from "@/app/trainings/components/TrainingTimeScore";
import { TrainingMuscleStats } from "@/app/trainings/components/TrainingMuscleStats";
import {
  TrainingExecTimeChart,
  ExecTimeItem,
} from "@/app/trainings/components/TrainingExecTimeChart";
import { fetchTrainingMuscleStats } from "@/core/trainingMuscles";
import { Training, TrainingWarmUp } from "@prisma/client";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const training = (await prisma.training.findUniqueOrThrow({
    where: { id },
    include: {
      WarmUp: true,
    },
  })) as Training & { WarmUp: TrainingWarmUp };

  const originalTraining = training.repeatedFromId
    ? await prisma.training.findUnique({
        where: { id: training.repeatedFromId },
        select: { id: true, plannedTo: true },
      })
    : null;
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
  const exercisesRaw = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
    include: {
      Action: true,
      ApproachGroup: {
        include: {
          Approaches: { orderBy: { priority: "asc" } },
        },
      },
      TrainingExerciseExecution: true,
      Training: { select: { plannedTo: true, userId: true } },
    },
    orderBy: { priority: "asc" },
  });

  const muscleStats = await fetchTrainingMuscleStats(training.id);

  // Подгрузим предыдущие метрики по каждому действию для этого пользователя
  const exercises = await Promise.all(
    exercisesRaw.map(async (e: any) => {
      const prev = await prisma.trainingExercise.findFirst({
        where: {
          actionId: e.actionId,
          completedAt: { not: null },
          Training: {
            userId: training.userId,
            plannedTo: { lt: e.Training.plannedTo },
          },
        },
        orderBy: { Training: { plannedTo: "desc" } },
        select: {
          liftedSum: true,
          liftedMean: true,
          liftedMax: true,
          liftedCountTotal: true,
          liftedCountMean: true,
        },
      });
      const prevSetsStats = prev
        ? {
            len: 0,
            weightSum: prev.liftedSum,
            weightMean: prev.liftedMean,
            weightMax: prev.liftedMax,
            countSum: prev.liftedCountTotal,
            countMean: prev.liftedCountMean,
          }
        : null;
      return { ...e, prevSetsStats };
    }),
  );

  // Соберем длительности подходов для диаграммы (только если тренировка завершена)
  let execTimeItems: ExecTimeItem[] = [];
  if (training.completedAt) {
    const durations = await prisma.trainingExerciseExecutionDuration.findMany({
      where: { trainingId: id },
      orderBy: { sequence: "asc" },
      include: {
        TrainingExercise: { include: { Action: true } },
      },
    });
    const perExerciseCounter: Record<number, number> = {};
    execTimeItems = durations.map((d) => {
      const exId = d.trainingExerciseId;
      perExerciseCounter[exId] = (perExerciseCounter[exId] ?? 0) + 1;
      const exerciseName =
        (d.TrainingExercise.Action as any).alias ||
        (d.TrainingExercise.Action as any).title;
      return {
        seconds: d.seconds,
        exercise: exerciseName,
        set: perExerciseCounter[exId],
      } as ExecTimeItem;
    });
  }

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
            <div className="mb-2">
              <TrainingForm training={training} />
            </div>
          </>
        )}
      </header>
      {originalTraining && (
        <div className="alert alert-light mb-3 d-flex align-items-center justify-content-between">
          <span>
            Повтор тренировки от{" "}
            {moment(originalTraining.plannedTo).format(DateFormat)}
          </span>
          <Link
            href={`/trainings/${originalTraining.id}`}
            className="link-secondary custom-link small"
            target="_blank"
          >
            Перейти
          </Link>
        </div>
      )}
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
            {training.WarmUp && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col-md-3 col-sm-12">Разминка</div>
                </div>
              </li>
            )}
            {exercises.map((e) => (
              <li className="list-group-item" data-id={e.id} key={e.id}>
                <TrainingExerciseItemControl
                  exercise={e}
                  canControl={!training.startedAt}
                />
              </li>
            ))}
          </ul>

          {/* Список мышц по тренировке */}
          <div className="mb-3">
            <TrainingMuscleStats
              stats={muscleStats as any}
              className={"alert alert-light"}
            />
          </div>

          <div className="alert alert-light">
            <TrainingTimeScore training={training} />
          </div>
          {training.completedAt && execTimeItems.length > 0 && (
            <div className="mb-3">
              <TrainingExecTimeChart items={execTimeItems} />
            </div>
          )}
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
      <div className="mb-3">
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
