import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";
import { getCurrentUserId } from "@/tools/auth";
import { DateFormat, getCurrentDayBorders } from "@/tools/dates";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";
import TrainingPeriodManager from "@/app/trainings/components/TrainingPeriodManager";
import { getCurrentTrainingPeriod, pickOnlyOptsFromItem } from "@/core/periods";
import { WeightPanel } from "@/app/weights/panel";
import { WeightsForm } from "@/app/weights/form";
import { WeightsChart } from "@/app/profile/components/WeightsChart";
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

  return (
    <div>
      {trainings.length ? (
        <div className="mb-3">
          {trainings.map((t) => (
            <div className="card" key={t.id}>
              <div className="card-body">
                <h5 className="card-title">
                  Тренировка на {moment(t.plannedTo).format(DateFormat)}
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
    </div>
  );
}
