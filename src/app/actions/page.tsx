import Link from "next/link";
import { prisma } from "@/tools/db";

export default async function ActionsPage() {
  const actions = await prisma.actions.findMany({
    include: {
      MuscleAgony: true,
      CurrentApproachGroup: true,
    },
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
              <th>Подходов</th>
              <th>Σ кг</th>
              <th>÷ кг</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>
                  <Link href={`/actions/${a.id}`}>{a.title}</Link>
                </td>
                <td>{a.MuscleAgony.title}</td>
                <td>
                  {a.CurrentApproachGroup ? (
                    a.CurrentApproachGroup.count
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.CurrentApproachGroup ? (
                    a.CurrentApproachGroup.sum
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.CurrentApproachGroup ? (
                    a.CurrentApproachGroup.mean.toPrecision(3)
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
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
