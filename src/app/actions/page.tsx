import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";

export default async function ActionsPage() {
  const userId = await getCurrentUserId();
  const actions = await prisma.action.findMany({
    include: {
      ActionMass: {
        where: { userId },
        take: 1,
        include: {
          CurrentApproachGroup: { include: { Approaches: true } },
        },
      },
      ActionStrength: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
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
                  {a.ActionStrength.length &&
                  a.ActionStrength[0].CurrentApproachGroup ? (
                    a.ActionStrength[0].CurrentApproachGroup.count
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.ActionStrength.length &&
                  a.ActionStrength[0].CurrentApproachGroup ? (
                    a.ActionStrength[0].CurrentApproachGroup.sum
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.ActionStrength.length &&
                  a.ActionStrength[0].CurrentApproachGroup ? (
                    a.ActionStrength[0].CurrentApproachGroup.mean.toPrecision(3)
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.ActionMass.length &&
                  a.ActionMass[0].CurrentApproachGroup ? (
                    a.ActionMass[0].CurrentApproachGroup.count
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.ActionMass.length &&
                  a.ActionMass[0].CurrentApproachGroup ? (
                    a.ActionMass[0].CurrentApproachGroup.sum
                  ) : (
                    <span>&mdash;</span>
                  )}
                </td>
                <td>
                  {a.ActionMass.length &&
                  a.ActionMass[0].CurrentApproachGroup ? (
                    a.ActionMass[0].CurrentApproachGroup.mean.toPrecision(3)
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
