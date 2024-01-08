import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function ActionsPage() {
  const actions = await prisma.actions.findMany({
    include: { muscleAgony: true },
  });

  return (
    <>
      <header className="mb-3">Список движений</header>
      <div className="mb-3">
        <Link className="btn btn-primary" href={`/actions/create`}>
          Добавить
        </Link>
      </div>
      {actions.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Мышца-агонист</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>
                  <Link href={`/actions/${a.id}`}>{a.title}</Link>
                </td>
                <td>{a.muscleAgony.title}</td>
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
