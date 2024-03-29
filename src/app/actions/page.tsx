import Link from "next/link";
import { prisma } from "@/tools/db";

export default async function ActionsPage() {
  const actions = await prisma.action.findMany({
    include: {
      Mass: {
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      Strength: {
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
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
              <th>Мышцы-агонисты</th>
              <th>Мышцы-синергисты</th>
              <th>Подходов</th>
              <th>Σ кг</th>
              <th>÷ кг</th>
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
                <td>
                  <div className="d-flex gap-3">
                    {a.MusclesAgony.map((l) => (
                      <span key={l.muscleId}>
                        {l.Muscle.Group.title}: {l.Muscle.title}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-3">
                    {a.MusclesSynergy.map((l) => (
                      <span key={l.muscleId}>
                        {l.Muscle.Group.title}: {l.Muscle.title}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  {a.Strength.CurrentApproachGroup ? (
                    a.Strength.CurrentApproachGroup.count
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.Strength.CurrentApproachGroup ? (
                    a.Strength.CurrentApproachGroup.sum
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.Strength.CurrentApproachGroup ? (
                    a.Strength.CurrentApproachGroup.mean.toPrecision(3)
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.Mass.CurrentApproachGroup ? (
                    a.Mass.CurrentApproachGroup.count
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.Mass.CurrentApproachGroup ? (
                    a.Mass.CurrentApproachGroup.sum
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.Mass.CurrentApproachGroup ? (
                    a.Mass.CurrentApproachGroup.mean.toPrecision(3)
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
