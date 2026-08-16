import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";
import { getCurrentUserId } from "@/tools/auth";
import { DateFormat, getCurrentDayBorders } from "@/tools/dates";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";
import { WeightPanel } from "@/app/weights/panel";
import { WeightsForm } from "@/app/weights/form";
import { WeightsChart } from "@/app/profile/components/WeightsChart";
import { RecordsPanel } from "@/components/records/RecordsPanel";
import React from "react";
import { TrainingTimeScore } from "@/app/trainings/components/TrainingTimeScore";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const { gte, lt } = getCurrentDayBorders();

  const trainings = await prisma.training.findMany({
    where: {
      userId,
      completedAt: null,
      plannedTo: { gte, lt },
    },
    orderBy: {
      plannedTo: "asc",
    },
    include: {
      TrainingExercise: {
        orderBy: { priority: "asc" },
        include: { Action: true },
      },
      Equipment: true,
    },
  });
  const weight = await prisma.weight.findFirst({
    where: {
      userId,
      createdAt: { gte, lt },
    },
  });
  const weights = await prisma.weight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Рекорды последних 3 завершённых тренировок (базы не показываем).
  // Если в них рекордов нет — показываем последние рекорды, чтобы блок не пропадал
  const lastTrainings = await prisma.training.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 3,
    select: { id: true },
  });
  let records = await prisma.personalRecord.findMany({
    where: {
      userId,
      trainingId: { in: lastTrainings.map((t) => t.id) },
      previousValue: { not: null },
    },
    orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
    include: { Action: { select: { id: true, title: true, alias: true } } },
  });
  if (!records.length) {
    records = await prisma.personalRecord.findMany({
      where: { userId, previousValue: { not: null } },
      orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
      take: 5,
      include: { Action: { select: { id: true, title: true, alias: true } } },
    });
  }

  return (
    <div>
      {trainings.length ? (
        <div className="mb-3">
          {trainings.map((t) => (
            <div className="card" key={t.id}>
              <div className="card-body">
                <h5 className="card-title d-flex justify-content-between align-items-center">
                  <span>
                    Тренировка на {moment(t.plannedTo).format(DateFormat)}
                  </span>
                  {t.Equipment && (
                    <small className="fw-light text-muted">
                      {t.Equipment!.name.toLowerCase()}
                    </small>
                  )}
                </h5>
                <div className="card-text">
                  Упражнения:{" "}
                  {t.TrainingExercise.map((e) => e.Action.title).join(", ")}
                </div>
                <TrainingTimeScore training={t} />
                <div className="card-link d-flex gap-3">
                  <Link href={`/trainings/${t.id}/execute`}>Погнали</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 d-flex justify-content-end">
          <TrainingCreateForm btnTitle="Назначить тренировку" />
        </div>
      )}
      {weight ? <WeightPanel weight={weight} /> : <WeightsForm />}
      {weights && <WeightsChart weights={weights} />}
      <RecordsPanel records={records} />
    </div>
  );
}
