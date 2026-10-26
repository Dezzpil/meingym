"use client";

import type { Training } from "@prisma/client";
import Link from "next/link";
import moment from "moment/moment";
import { useMemo } from "react";
import type {
  ActionPurposeCnt,
  MuscleGroupTitleToExercisesCnt,
} from "@/app/trainings/page";
import type { TrainingDynamics } from "@/core/dynamics";
import { DateFormat, TimeFormat } from "@/tools/dates";
import { PurposeName } from "@/tools/purposes";
import { LuCircleDashed, LuGauge } from "react-icons/lu";
import { FaClock } from "react-icons/fa6";
import { NameOfTheDay } from "@/components/NameOfTheDay";
import { Sparkline } from "@/components/Sparkline";

type Props = {
  training: Training & { TrainingExercise: { id: number }[] };
  muscleGroupsCounts?: MuscleGroupTitleToExercisesCnt;
  purposeCounts?: ActionPurposeCnt;
  dynamics?: TrainingDynamics;
};

export function TrainingListCard({
  training,
  muscleGroupsCounts,
  purposeCounts,
  dynamics,
}: Props) {
  const exercisesCnt = training.TrainingExercise.length;

  const muscleGroups = useMemo(
    () =>
      Object.entries(muscleGroupsCounts ?? {}).sort(([, a], [, b]) => b - a),
    [muscleGroupsCounts],
  );

  // Нулевые доли целей только шумят; доминирующая подсвечивается
  const purposeShares = useMemo(() => {
    if (!purposeCounts || !exercisesCnt) return [];
    return (["STRENGTH", "MASS", "LOSS"] as const)
      .map((purpose) => ({ purpose, cnt: purposeCounts[purpose] }))
      .filter(({ cnt }) => cnt > 0)
      .sort((a, b) => b.cnt - a.cnt)
      .map(({ purpose, cnt }, index) => ({
        title: PurposeName[purpose],
        share: Math.round((cnt / exercisesCnt) * 100),
        isMain: index === 0,
      }));
  }, [purposeCounts, exercisesCnt]);

  const plannedMins = training.timeScoreInMins;
  const isCompleted = !!training.completedAt;
  const realMins =
    training.startedAt && isCompleted
      ? moment(training.completedAt).diff(training.startedAt, "minute")
      : null;

  return (
    <div className="card mb-2">
      <div className="card-header d-flex flex-wrap align-items-center gap-2">
        <Link href={`/trainings/${training.id}`} className="fw-semibold">
          {moment(training.plannedTo).format(DateFormat)}
        </Link>
        <NameOfTheDay date={training.plannedTo} />
        {training.isCircuit && (
          <span className="tag-chip">
            <LuCircleDashed />
            круговая
          </span>
        )}
        {training.difficultyScore > 0 && (
          <Link
            href="/trainings/dynamics"
            className="stat-chip ms-auto text-decoration-none"
            title="Сложность: сумма базовости упражнений, взвешенная по плановой нагрузке. Нажмите для просмотра динамики"
          >
            <LuGauge className="text-muted" />
            <span className="chip-label">Сложность</span>
            <b>{training.difficultyScore.toFixed(1)}</b>
            {dynamics?.hasEnoughData && dynamics.relativeToMean !== null && (
              <>
                <span className={dynamics.relativeToMean >= 0 ? "text-success" : "text-muted"}>
                  {dynamics.relativeToMean >= 0 ? "+" : ""}
                  {dynamics.relativeToMean.toFixed(0)}%
                </span>
                {dynamics.sparkline.length >= 2 && (
                  <Sparkline
                    data={dynamics.sparkline}
                    width={50}
                    height={16}
                    color={dynamics.relativeToMean >= 0 ? "#198754" : "#6c757d"}
                  />
                )}
              </>
            )}
          </Link>
        )}
      </div>
      <div className="card-body">
        {training.commonComment && (
          <div className="mb-2 text-muted clamp-2" title={training.commonComment}>
            {training.commonComment}
          </div>
        )}

        <div className="chip-row">
          <span className="stat-chip">
            <span className="chip-label">Упражнений</span>
            <b>{exercisesCnt}</b>
          </span>
          {(plannedMins > 0 || realMins !== null) && (
            <span className="stat-chip" title="Длительность тренировки">
              <FaClock className="text-muted" />
              {plannedMins > 0 && (
                <>
                  <span className="chip-label">План</span>~{plannedMins.toFixed(0)} мин.
                </>
              )}
              {realMins !== null && (
                <>
                  {plannedMins > 0 && <span className="mx-1">/</span>}
                  <span className="chip-label">Факт</span>
                  <span className="text-success">{realMins} мин.</span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="chip-row">
          <span className="tag-chip">
            <span className="chip-label">Мышцы:</span>
            {muscleGroups.length ? (
              muscleGroups.map(([title, cnt], idx) => (
                <span key={title}>
                  {idx > 0 && ", "}
                  {title} <b>{cnt}</b>
                </span>
              ))
            ) : (
              <span>не заданы</span>
            )}
          </span>
        </div>

        {purposeShares.length > 0 && (
          <div className="chip-row">
            <span className="tag-chip">
              <span className="chip-label">Цели:</span>
              {purposeShares.map(({ title, share, isMain }, idx) => (
                <span key={title} className={isMain ? "fw-semibold" : ""}>
                  {idx > 0 && ", "}
                  {title} {share}%
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="small text-muted d-flex flex-wrap column-gap-2">
          {training.startedAt ? (
            <>
              <span>
                начата{" "}
                {moment(training.startedAt).format(
                  [DateFormat, TimeFormat].join(" "),
                )}
              </span>
              {isCompleted ? (
                <span>
                  завершена {moment(training.completedAt).format(TimeFormat)}
                </span>
              ) : (
                <span>в процессе</span>
              )}
            </>
          ) : (
            <span>{isCompleted ? "выполнена" : "не выполнена"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
