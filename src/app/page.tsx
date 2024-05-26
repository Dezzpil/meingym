import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";
import { WeightsForm } from "@/app/weights/form";
import { getCurrentUserId } from "@/tools/auth";
import { WeightPanel } from "@/app/weights/panel";
import { DateFormat, getCurrentDayBorders } from "@/tools/dates";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";

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

  return (
    <div>
      {weight ? <WeightPanel weight={weight} /> : <WeightsForm />}
      <hr />
      {trainings.length ? (
        trainings.map((t) => (
          <div className="card" key={t.id}>
            <div className="card-body">
              <h5 className="card-title">
                Тренировка на {moment(t.plannedTo).format(DateFormat)}
              </h5>
              <div className="card-text">
                Упражнения:{" "}
                {t.TrainingExercise.map((e) => e.Action.title).join(", ")}
              </div>
              <div className="card-text">Цель: 50 / 50</div>
              <div className="card-link d-flex gap-3">
                <Link href={`/trainings/${t.id}/execute`}>Погнали</Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div>
          <TrainingCreateForm btnTitle="Назначить тренировку" />
        </div>
      )}
    </div>
  );
}
