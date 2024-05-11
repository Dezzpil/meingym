import Link from "next/link";
import { prisma } from "@/tools/db";

export default async function MusclesGroupsPage() {
  const data = await prisma.muscleGroup.findMany({ include: { Muscle: true } });

  return (
    <>
      <header className="mb-3">Список мышечных групп</header>
      <div className="mb-3">
        <Link className="btn btn-primary" href={`/musclesgroups/create`}>
          Добавить
        </Link>
      </div>
      {data.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Мышцы</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>
                  <Link href={`/musclesgroups/${d.id}`}>{d.title}</Link>
                </td>
                <td>{d.Muscle.length}</td>
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
