import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import {
  computeProcessLine,
  compute4WeekMovingAverage,
  computeHeatmap,
  computeLikeForLikeComparisons,
} from "@/core/dynamicsPage";
import { PageParams } from "@/tools/types";
import { DateFormat } from "@/tools/dates";
import moment from "moment";
import Link from "next/link";

export default async function DynamicsPage({ searchParams }: PageParams) {
  const userId = await getCurrentUserId();

  // По умолчанию показываем последние 3 месяца
  const monthsBack = parseInt(searchParams.months) || 3;
  const startDate = moment().subtract(monthsBack, "months").startOf("month").toDate();

  const trainings = await prisma.training.findMany({
    where: {
      userId,
      plannedTo: { gte: startDate },
      executedDifficultyScore: { gt: 0 }, // только выполненные с данными
    },
    include: {
      Period: {
        select: { id: true, startDate: true, endDate: true },
      },
      PersonalRecords: {
        select: { id: true, achievedAt: true },
      },
      MuscleLoad: {
        include: {
          MuscleGroup: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { plannedTo: "asc" },
  });

  const processLine = computeProcessLine(trainings);
  const movingAverage = compute4WeekMovingAverage(processLine);

  const muscleGroupLoads = trainings.flatMap((t) =>
    t.MuscleLoad.map((l) => ({
      trainingId: t.id,
      muscleGroupId: l.MuscleGroup.id,
      muscleGroupTitle: l.MuscleGroup.title,
      plannedLoad: l.plannedLoad,
      executedLoad: l.executedLoad,
    })),
  );

  const heatmap = computeHeatmap(trainings, muscleGroupLoads);
  const comparisons = computeLikeForLikeComparisons(trainings);

  // Группировка heatmap по неделям для отображения
  const weeks = Array.from(new Set(heatmap.map((c) => c.weekNumber))).sort(
    (a, b) => a - b,
  );
  const muscleGroups = Array.from(
    new Map(heatmap.map((c) => [c.muscleGroupId, c.muscleGroupTitle])).entries(),
  );

  const maxLoad = Math.max(...heatmap.map((c) => Math.max(c.plannedLoad, c.executedLoad)), 1);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Динамика тренировок</h1>
        <div className="d-flex gap-2">
          <Link href="/trainings" className="btn btn-outline-secondary btn-sm">
            ← К списку
          </Link>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            defaultValue={monthsBack}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("months", e.target.value);
              window.location.href = url.toString();
            }}
          >
            <option value={1}>1 месяц</option>
            <option value={3}>3 месяца</option>
            <option value={6}>6 месяцев</option>
            <option value={12}>12 месяцев</option>
          </select>
        </div>
      </div>

      {trainings.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3 border">
          <p className="text-muted mb-0">
            Нет данных для отображения динамики. Выполните хотя бы одну тренировку.
          </p>
        </div>
      ) : (
        <>
          {/* Линия процесса */}
          <section className="mb-5">
            <h2 className="h5 mb-3">Линия тренировочного процесса</h2>
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th className="text-end">План</th>
                        <th className="text-end">Факт</th>
                        <th className="text-end">Скользящее среднее (4 нед.)</th>
                        <th className="text-center">Рекорд</th>
                        <th className="text-center">Период</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processLine.map((point, idx) => (
                        <tr key={point.trainingId}>
                          <td>
                            <Link href={`/trainings/${point.trainingId}`}>
                              {moment(point.plannedTo).format(DateFormat)}
                            </Link>
                          </td>
                          <td className="text-end">{point.plannedDifficulty.toFixed(1)}</td>
                          <td className="text-end">
                            {point.executedDifficulty !== null
                              ? point.executedDifficulty.toFixed(1)
                              : "—"}
                          </td>
                          <td className="text-end">
                            {movingAverage[idx] !== null
                              ? movingAverage[idx]!.toFixed(1)
                              : "—"}
                          </td>
                          <td className="text-center">
                            {point.hasPersonalRecord && <span className="badge bg-warning text-dark">★</span>}
                          </td>
                          <td className="text-center">
                            {point.periodBoundary === "start" && (
                              <span className="badge bg-info">Начало</span>
                            )}
                            {point.periodBoundary === "end" && (
                              <span className="badge bg-secondary">Конец</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Heatmap нагрузки по группам мышц */}
          <section className="mb-5">
            <h2 className="h5 mb-3">Нагрузка по группам мышц × неделя</h2>
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>Группа мышц</th>
                        {weeks.map((w) => {
                          const weekStart = heatmap.find((c) => c.weekNumber === w)?.weekStart;
                          return (
                            <th key={w} className="text-center" style={{ minWidth: "80px" }}>
                              {weekStart && moment(weekStart).format("DD.MM")}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {muscleGroups.map(([mgId, mgTitle]) => (
                        <tr key={mgId}>
                          <td className="fw-semibold">{mgTitle}</td>
                          {weeks.map((w) => {
                            const cell = heatmap.find(
                              (c) => c.muscleGroupId === mgId && c.weekNumber === w,
                            );
                            if (!cell) {
                              return <td key={w} className="bg-light"></td>;
                            }
                            const intensity = cell.executedLoad / maxLoad;
                            const bgColor = `rgba(25, 135, 84, ${intensity})`;
                            return (
                              <td
                                key={w}
                                className="text-center"
                                style={{
                                  backgroundColor: bgColor,
                                  color: intensity > 0.5 ? "#fff" : "#000",
                                }}
                                title={`${mgTitle}, неделя ${w}: план ${cell.plannedLoad.toFixed(1)}, факт ${cell.executedLoad.toFixed(1)}${cell.hasRecoveryConflict ? " ⚠️ восстановление < 72ч" : ""}`}
                              >
                                {cell.executedLoad > 0 ? cell.executedLoad.toFixed(0) : ""}
                                {cell.hasRecoveryConflict && " ⚠️"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 small text-muted">
                  <span className="badge bg-warning text-dark me-2">⚠️</span>
                  Тренировка на эту группу мышц была менее 72 часов назад (окно восстановления)
                </div>
              </div>
            </div>
          </section>

          {/* Сравнение «как в прошлый раз» */}
          <section className="mb-5">
            <h2 className="h5 mb-3">Сравнение «как в прошлый раз»</h2>
            <div className="card">
              <div className="card-body">
                {comparisons.length === 0 ? (
                  <p className="text-muted mb-0">
                    Нет данных для сравнения. Нужно хотя бы 2 тренировки с одинаковым набором мышц.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Текущая тренировка</th>
                          <th>Предыдущая</th>
                          <th className="text-center">Дней между</th>
                          <th className="text-end">Предыдущая сложность</th>
                          <th className="text-end">Текущая сложность</th>
                          <th className="text-end">Изменение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisons.map((c) => (
                          <tr key={c.currentTrainingId}>
                            <td>
                              <Link href={`/trainings/${c.currentTrainingId}`}>
                                {moment(
                                  trainings.find((t) => t.id === c.currentTrainingId)!.plannedTo,
                                ).format(DateFormat)}
                              </Link>
                            </td>
                            <td>
                              {c.previousTrainingId !== null && (
                                <Link href={`/trainings/${c.previousTrainingId}`}>
                                  {moment(
                                    trainings.find((t) => t.id === c.previousTrainingId)!.plannedTo,
                                  ).format(DateFormat)}
                                </Link>
                              )}
                            </td>
                            <td className="text-center">{c.daysBetween}</td>
                            <td className="text-end">
                              {c.previousDifficulty !== null
                                ? c.previousDifficulty.toFixed(1)
                                : "—"}
                            </td>
                            <td className="text-end">{c.currentDifficulty.toFixed(1)}</td>
                            <td className="text-end">
                              {c.delta !== null ? (
                                <span className={c.delta >= 0 ? "text-success" : "text-danger"}>
                                  {c.delta >= 0 ? "+" : ""}
                                  {c.delta.toFixed(0)}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
