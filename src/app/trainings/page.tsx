import { prisma } from "@/tools/db";
import Link from "next/link";

export default async function TrainingsPage() {
  const trainings = await prisma.training.findMany();

  return (
    <>
      <header className="mb-3">Тренировки</header>
      <div className="mb-3">
        <Link href={`/trainings/create`}>Добавить</Link>
      </div>
      {trainings.length ? (
        <table>
          <thead>
            <tr>
              <th></th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      ) : (
        <p>Список пуст</p>
      )}
    </>
  );
}
