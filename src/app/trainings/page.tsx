import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";

export default async function TrainingsPage() {
  const trainings = await prisma.training.findMany({
    include: { TrainingExercise: true },
    orderBy: { plannedTo: "desc" },
  });

  return (
    <>
      <header className="mb-3">Список тренировок</header>
      <div className="mb-3">
        <Link href={`/trainings/create`} className="btn btn-primary">
          Добавить
        </Link>
      </div>
      {trainings.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Запланирована</th>
              <th>Упражнений</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <Link href={`/trainings/${t.id}`}>
                    {moment(t.plannedTo).format("Y-M-D")}
                  </Link>
                </td>
                <td>{t.TrainingExercise.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Список пуст</p>
      )}
    </>
  );
}
