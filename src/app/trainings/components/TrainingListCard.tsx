"use client";

import type { Purpose, Training } from "@prisma/client";
import Link from "next/link";
import moment from "moment/moment";
import { useMemo } from "react";
import classNames from "classnames";
import type { MuscleGroupTitleToExercisesCnt } from "@/app/trainings/page";
import type { TrainingDynamics } from "@/core/dynamics";
import {
  computeMuscleLoadBreakdown,
  computePurposeShares,
  formatTonnage,
  resolveTrainingStatus,
  sumTrainingVolume,
  topMuscleGroups,
  type TrainingStatus,
} from "@/core/trainingSummary";
import { formatShortDate } from "@/tools/dates";
import { PurposeShortName } from "@/tools/purposes";
import { muscleGroupColor } from "@/tools/trainingPalette";
import {
  LuCircleDashed,
  LuDumbbell,
  LuGauge,
  LuRepeat2,
  LuTrophy,
} from "react-icons/lu";
import { Sparkline } from "@/components/Sparkline";
import { MuscleLoadBar } from "@/app/trainings/components/MuscleLoadBar";

type Props = {
  training: Training & {
    TrainingExercise: {
      id: number;
      purpose: Purpose;
      liftedSum: number;
      liftedCountTotal: number;
      Action: { title: string };
    }[];
    MuscleLoad: {
      plannedLoad: number;
      executedLoad: number;
      agonyCnt: number;
      MuscleGroup: { title: string };
    }[];
    PersonalRecords: { id: number }[];
  };
  muscleGroupsCounts?: MuscleGroupTitleToExercisesCnt;
  dynamics?: TrainingDynamics;
  now: Date;
};

const STATUS_LABEL: Record<Exclude<TrainingStatus, "done">, string> = {
  active: "в процессе",
  planned: "план",
  missed: "не выполнена",
};

export function TrainingListCard({
  training,
  muscleGroupsCounts,
  dynamics,
  now,
}: Props) {
  const exercises = training.TrainingExercise;
  const exercisesCnt = exercises.length;

  const title = useMemo(() => {
    const groups = topMuscleGroups(muscleGroupsCounts ?? {});
    if (groups.length) return groups.join(" · ");
    return exercisesCnt ? "Мышцы не заданы" : "Без упражнений";
  }, [muscleGroupsCounts, exercisesCnt]);

  const status = resolveTrainingStatus(training, now);
  const isDone = status === "done";

  const realMins =
    training.startedAt && training.completedAt
      ? moment(training.completedAt).diff(training.startedAt, "minute")
      : null;
  const plannedMins = Math.round(training.timeScoreInMins);

  // 0 в executedDifficultyScore означает «данных о выполнении нет», а не «было легко»
  const planScore = training.difficultyScore;
  const factScore = training.executedDifficultyScore;
  const hasScore = planScore > 0 || factScore > 0;
  const hasPair = planScore > 0 && factScore > 0;

  const delta =
    dynamics?.hasEnoughData && dynamics.relativeToMean !== null
      ? dynamics.relativeToMean
      : null;
  const deltaIsUp = delta !== null && delta >= 0;

  const mainPurpose = useMemo(
    () => computePurposeShares(exercises.map((e) => e.purpose))[0] ?? null,
    [exercises],
  );

  const breakdown = useMemo(() => {
    const loads = training.MuscleLoad.map((l) => ({
      title: l.MuscleGroup.title,
      plannedLoad: l.plannedLoad,
      executedLoad: l.executedLoad,
      agonyCnt: l.agonyCnt,
    }));
    // нагрузка считается фоновой задачей: пока её нет, показываем доли упражнений
    const source = loads.length
      ? loads
      : Object.entries(muscleGroupsCounts ?? {}).map(([title, cnt]) => ({
          title,
          plannedLoad: 0,
          executedLoad: 0,
          agonyCnt: cnt,
        }));
    return computeMuscleLoadBreakdown(source, { executed: isDone });
  }, [training.MuscleLoad, muscleGroupsCounts, isDone]);

  const volume = useMemo(() => sumTrainingVolume(exercises), [exercises]);
  const recordsCnt = training.PersonalRecords.length;
  const hasVolume = volume.tonnageKg > 0 || volume.reps > 0;

  const exercisePreview = useMemo(
    () => exercises.map((e) => e.Action.title).join(", "),
    [exercises],
  );

  const restTitles = breakdown.rest
    .map((s) => `${s.title} ${Math.round(s.share)}%`)
    .join(", ");

  return (
    <div className="card training-card mb-2">
      <div className="card-body">
        <div className="training-card-head">
          <Link
            href={`/trainings/${training.id}`}
            className="training-card-title stretched-link text-decoration-none"
          >
            {title}
            {training.isCircuit && (
              <LuCircleDashed
                className="training-card-circuit"
                title="Круговая тренировка"
              />
            )}
          </Link>

          {mainPurpose && (
            <span
              className={classNames(
                "training-card-purpose",
                `training-card-purpose-${mainPurpose.purpose.toLowerCase()}`,
              )}
              title={`${mainPurpose.title} — ${mainPurpose.share}% упражнений`}
            >
              {PurposeShortName[mainPurpose.purpose]}
              {mainPurpose.share < 100 && (
                <span className="training-card-purpose-share">
                  {mainPurpose.share}%
                </span>
              )}
            </span>
          )}
        </div>

        <div className="training-card-meta">
          <span className="training-card-meta-text">
            {formatShortDate(training.plannedTo)}
            {" · "}
            {exercisesCnt} упр.
            {isDone
              ? realMins !== null && (
                  <>
                    {" · "}
                    <span className="training-card-meta-strong">{realMins} мин</span>
                  </>
                )
              : plannedMins > 0 && (
                  <>
                    {" · "}~{plannedMins} мин
                  </>
                )}
          </span>
          {!isDone && (
            <span className={`training-card-status training-card-status-${status}`}>
              {STATUS_LABEL[status]}
            </span>
          )}
        </div>

        {hasScore && (
          <Link
            href="/trainings/dynamics"
            className="training-card-score text-decoration-none"
            title="Сложность: план → факт, дельта к среднему по этой же нити. Нажмите для просмотра динамики"
          >
            <LuGauge className="training-card-score-icon" />
            {planScore > 0 && (
              <span
                className={
                  hasPair
                    ? "training-card-score-plan"
                    : "training-card-score-fact"
                }
              >
                {planScore.toFixed(1)}
              </span>
            )}
            {hasPair && (
              <>
                <span className="training-card-score-arrow">&rarr;</span>
                <span className="training-card-score-fact">
                  {factScore.toFixed(1)}
                </span>
              </>
            )}
            {planScore === 0 && factScore > 0 && (
              <span className="training-card-score-fact">
                {factScore.toFixed(1)}
              </span>
            )}

            {delta !== null && (
              <span
                className={classNames(
                  "training-card-score-delta",
                  deltaIsUp
                    ? "training-card-delta-up"
                    : "training-card-delta-down",
                )}
              >
                {deltaIsUp ? "+" : ""}
                {delta.toFixed(0)}%
                {dynamics!.sparkline.length >= 2 && (
                  <Sparkline
                    data={dynamics!.sparkline}
                    width={44}
                    height={14}
                    color={deltaIsUp ? "#2e9e4f" : "#8a94a6"}
                  />
                )}
              </span>
            )}
          </Link>
        )}

        {breakdown.segments.length > 0 && (
          <div className="training-card-load">
            <MuscleLoadBar breakdown={breakdown} />
            <div className="training-card-load-legend">
              {breakdown.segments.map((s) => (
                <span key={s.title}>
                  <svg className="training-card-load-dot" viewBox="0 0 8 8" aria-hidden="true">
                    <circle cx={4} cy={4} r={4} fill={muscleGroupColor(s.title)} />
                  </svg>
                  {s.title}{" "}
                  <span className="training-card-load-share">
                    {Math.round(s.share)}%
                  </span>
                </span>
              ))}
              {breakdown.restCnt > 0 && (
                <span
                  className="training-card-load-rest"
                  title={`Прочие группы: ${restTitles}`}
                >
                  +{breakdown.restCnt}
                </span>
              )}
              {breakdown.basis === "count" && (
                <span className="training-card-load-basis" title="Нагрузка ещё не посчитана, показаны доли упражнений">
                  по упр.
                </span>
              )}
            </div>
          </div>
        )}

        {hasVolume || recordsCnt > 0 ? (
          <div className="training-card-stats">
            {volume.tonnageKg > 0 && (
              <span className="training-card-stat training-card-stat-volume" title="Суммарный поднятый вес">
                <LuDumbbell className="training-card-stat-icon" />
                {formatTonnage(volume.tonnageKg)}
              </span>
            )}
            {volume.reps > 0 && (
              <span className="training-card-stat" title="Всего повторений">
                <LuRepeat2 className="training-card-stat-icon" />
                {volume.reps}
              </span>
            )}
            {recordsCnt > 0 && (
              <span className="training-card-stat training-card-stat-record" title={`Личных рекордов: ${recordsCnt}`}>
                <LuTrophy className="training-card-stat-icon" />
                {recordsCnt}
              </span>
            )}
          </div>
        ) : (
          exercisePreview && (
            <div className="training-card-preview clamp-1" title={exercisePreview}>
              {exercisePreview}
            </div>
          )
        )}

        {training.commonComment && (
          <div
            className="training-card-comment clamp-1"
            title={training.commonComment}
          >
            {training.commonComment}
          </div>
        )}
      </div>
    </div>
  );
}