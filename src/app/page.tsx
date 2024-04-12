import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";

export default async function HomePage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const trainings = await prisma.training.findMany({
    where: {
      completedAt: null,
      plannedTo: {
        gte: startOfDay,
        lt: endOfDay,
      },
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
          <h5 className="card-title">
            Тренировка на {moment(t.plannedTo).format("Y-M-D")}
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
      <Link href={`/trainings/create`}>Добавить тренировку</Link>
    </div>
  );
}
