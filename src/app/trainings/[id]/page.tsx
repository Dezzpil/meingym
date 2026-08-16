import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { TrainingExerciseFloatingAdd } from "@/app/trainings/components/TrainingExerciseFloatingAdd";
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
import { TrainingDifficultyBoost } from "@/app/trainings/components/TrainingDifficultyBoost";
import {
  ActionRequire,
  ActionRig,
  Equipment,
  EquipmentRequire,
  EquipmentRig,
  PersonalRecord,
  Training,
  TrainingWarmUp,
} from "@prisma/client";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  // Batch 1: независимые запросы
  const [training, userId] = await Promise.all([
    prisma.training.findUniqueOrThrow({
      where: { id },
      include: { WarmUp: true },
    }) as Promise<Training & { WarmUp: TrainingWarmUp }>,
    getCurrentUserId(),
  ]);

  // Batch 2: запросы, зависящие от training и userId
  const [originalTraining, userInfo, exercises, muscleStats, equipments] =
    await Promise.all([
      training.repeatedFromId
        ? prisma.training.findUnique({
            where: { id: training.repeatedFromId },
            select: { id: true, plannedTo: true },
          })
        : Promise.resolve(null),
      findUserInfo(userId),
      prisma.trainingExercise.findMany({
        where: { trainingId: id },
        include: {
          Action: true,
          ApproachGroup: {
            include: { Approaches: { orderBy: { priority: "asc" } } },
          },
          TrainingExerciseExecution: true,
          Training: { select: { plannedTo: true, userId: true } },
        },
        orderBy: { priority: "asc" },
      }),
      fetchTrainingMuscleStats(training.id),
      prisma.equipment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { Rigs: true, Requires: true },
      }),
    ]);

  // Подгрузим предыдущие метрики по каждому действию для этого пользователя
  const prevExercisesStats = await Promise.all(
    exercises.map(async (e: any) => {
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

  // Определим, есть ли усложнённые подходы (isBoost=true)
  const hasBoostedApproaches = prevExercisesStats.some((e: any) =>
    e.ApproachGroup?.Approaches?.some((a: any) => a.isBoost),
  );

  // Персональные рекорды, зафиксированные в этой тренировке (базы не показываем)
  const personalRecords: PersonalRecord[] = training.completedAt
    ? await prisma.personalRecord.findMany({
        where: {
          userId: training.userId,
          trainingId: id,
          previousValue: { not: null },
        },
        orderBy: [{ achievedAt: "asc" }, { id: "asc" }],
      })
    : [];
  const recordsByExerciseId = new Map<number, PersonalRecord[]>();
  for (const record of personalRecords) {
    const list = recordsByExerciseId.get(record.trainingExerciseId) ?? [];
    list.push(record);
    recordsByExerciseId.set(record.trainingExerciseId, list);
  }

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

  let currentEquipment:
    | (Equipment & { Rigs: EquipmentRig[]; Requires: EquipmentRequire[] })
    | null = null;
  if (training.equipmentId) {
    for (const q of equipments) {
      if (q.id === training.equipmentId) {
        currentEquipment = q;
        break;
      }
    }
  }

  const equipmentRigs = currentEquipment
    ? currentEquipment!.Rigs.map((r) => r.type).concat(ActionRig.OTHER)
    : [];
  const equipmentRequires = currentEquipment
    ? currentEquipment!.Requires.map((r) => r.type).concat(ActionRequire.NONE)
    : [];

  return (
    <>
      <header className="mb-3">
        <h3 className="d-flex flex-wrap column-gap-2 mb-3">
          <span>
            Тренировка {moment(training.plannedTo).format(DateFormat)}
          </span>
          <NameOfTheDay date={training.plannedTo} />
        </h3>
        {!training.startedAt && (
          <>
            <div className="mb-2">
              <TrainingForm training={training} equipments={equipments} />
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
      {prevExercisesStats.length ? (
        <>
          <ul className="list-group mb-3">
            {training.WarmUp && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col-md-3 col-sm-12">Разминка</div>
                </div>
              </li>
            )}
            {prevExercisesStats.map((e) => (
              <li className="list-group-item" data-id={e.id} key={e.id}>
                <TrainingExerciseItemControl
                  exercise={e}
                  canControl={!training.startedAt}
                  records={recordsByExerciseId.get(e.id)}
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
          <div className="alert alert-light d-flex align-items-center justify-content-between flex-wrap">
            <TrainingDifficultyBoost
              training={training}
              isStarted={!!training.startedAt}
              hasBoostedApproaches={hasBoostedApproaches}
            />
          </div>
          <div className="alert alert-light d-flex align-items-center justify-content-between flex-wrap">
            <TrainingTimeScore training={training} />
          </div>
          {/* TODO перенести эту логику внутрь компонента */}
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
        <TrainingExerciseFloatingAdd
          training={training}
          actions={[]}
          exercises={prevExercisesStats as any}
          defaultPurpose={userInfo.purpose}
          equipmentRigs={equipmentRigs}
          equipmentRequires={equipmentRequires}
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
