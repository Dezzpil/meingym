import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { PageParams } from "@/tools/types";
import { DateFormat } from "@/tools/dates";
import moment from "moment";

export default async function ActionsPage({ searchParams }: PageParams) {
  const userId = await getCurrentUserId();

  const groupId = searchParams.group ? parseInt(searchParams.group) : null;
  const where: Record<string, any> = {
    MusclesAgony: groupId !== null ? { some: { Muscle: { groupId } } } : {},
  };
  const strengthAllowed =
    searchParams.strengthAllowed && searchParams.strengthAllowed === "on"
      ? true
      : null;
  if (strengthAllowed !== null) {
    where["strengthAllowed"] = strengthAllowed;
  }

  const groups = await prisma.muscleGroup.findMany({});
  const actions = await prisma.action.findMany({
    where,
    orderBy: { updatedAt: "desc" },
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
      <div className="mb-3">
        <form
          method="GET"
          className="row row-cols-lg-auto g-3 align-items-center"
        >
          <div className="col-12">
            <select
              name="group"
              className="form-select"
              defaultValue={groupId ? groupId : undefined}
            >
              <option value="">&mdash;</option>
              {groups.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <div className="form-check form-check-inline">
              <input
                type="checkbox"
                name="strengthAllowed"
                id="strengthAllowed"
                className="form-check-input"
                defaultChecked={
                  strengthAllowed !== null ? strengthAllowed : false
                }
              ></input>
              <label className="form-check-label" htmlFor="strengthAllowed">
                Подходит для силовых?
              </label>
            </div>
          </div>
          <div className="col-12 hstack gap-3">
            <button type="submit" className="btn btn-primary">
              Найти
            </button>
            <Link className="btn btn-light" href={`/actions/create`}>
              Добавить движение
            </Link>
          </div>
        </form>
      </div>
      {actions.length ? (
        <>
          {actions.map((a) => (
            <div className="card mb-3" key={a.id}>
              <div className="card-header hstack justify-content-between">
                <Link href={`/actions/${a.id}`}>
                  {a.alias ? a.alias : a.title}
                </Link>
                <div className="hstack gap-3">
                  <span className="text-muted">
                    {moment(a.updatedAt).format(DateFormat)}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <ul className="list-inline mb-2">
                  <li className="list-inline-item">
                    <b>Мышцы-агонисты:</b>
                  </li>
                  {a.MusclesAgony.length ? (
                    a.MusclesAgony.map((l) => (
                      <li className="list-inline-item" key={l.muscleId}>
                        {l.Muscle.Group.title}: {l.Muscle.title}
                      </li>
                    ))
                  ) : (
                    <span className="text-muted">Не указаны</span>
                  )}
                </ul>
                <ul className="list-inline mb-2">
                  <li className="list-inline-item">
                    <b>Мышцы-синергисты:</b>
                  </li>
                  {a.MusclesSynergy.length ? (
                    a.MusclesSynergy.map((l) => (
                      <li className="list-inline-item" key={l.muscleId}>
                        {l.Muscle.Group.title}: {l.Muscle.title}
                      </li>
                    ))
                  ) : (
                    <span className="text-muted">Не указаны</span>
                  )}
                </ul>

                <div className="mb-2">
                  <b>На массу: </b>
                  {a.ActionMass.length &&
                  a.ActionMass[0].CurrentApproachGroup ? (
                    <span className="d-inline-flex gap-2 text-muted">
                      <span>
                        {a.ActionMass[0].CurrentApproachGroup.count} сетов
                      </span>
                      <span>{a.ActionMass[0].CurrentApproachGroup.sum} кг</span>
                      <span>
                        {a.ActionMass[0].CurrentApproachGroup.mean} кг
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">&nbsp;&mdash;</span>
                  )}
                </div>
                <div className="mb-2">
                  <b>На силу: </b>
                  {a.ActionStrength.length &&
                  a.ActionStrength[0].CurrentApproachGroup ? (
                    <span className="d-inline-flex gap-2 text-muted">
                      <span>
                        {a.ActionStrength[0].CurrentApproachGroup.count} сетов
                      </span>
                      <span>
                        {a.ActionStrength[0].CurrentApproachGroup.sum} кг
                      </span>
                      <span>
                        {a.ActionStrength[0].CurrentApproachGroup.mean} кг
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">&nbsp;&mdash;</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
