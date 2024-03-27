import { prisma } from "@/tools/db";
import { getPlannedToStr } from "@/tools/dates";
import Link from "next/link";

export default async function HomePage() {
  const trainings = await prisma.training.findMany({
    where: {
      completedAt: null,
      plannedToStr: getPlannedToStr(new Date()),
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

  return trainings.length ? (
    trainings.map((t) => (
      <div className="card" key={t.id}>
        <div className="card-body">
          <h5 className="card-title">Тренировка на {t.plannedToStr}</h5>
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
      <Link href={`/trainings/create`}>Добавить тренировку</Link>
    </div>
  );
}
