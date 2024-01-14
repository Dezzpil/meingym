import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function MusclesPage() {
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });

  return (
    <>
      <header className="mb-3">Список мышц</header>
      <div className="mb-3">
        <Link className="btn btn-primary" href={`/muscles/create`}>
          Добавить
        </Link>
      </div>

      {muscles.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Группа</th>
            </tr>
          </thead>
          <tbody>
            {muscles.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  <Link href={`/muscles/${m.id}`}>{m.title}</Link>
                </td>
                <td>{m.Group.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
