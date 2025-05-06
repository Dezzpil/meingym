import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUser } from "@/tools/auth";
import { PageParams } from "@/tools/types";
import { DateFormat } from "@/tools/dates";
import moment from "moment";
import {
  Purpose,
  type ApproachesGroup,
  type TrainingExerciseScore,
} from "@prisma/client";
import { ActionWithMusclesType } from "@/app/actions/types";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";
import { UserRole } from ".prisma/client";
import { ActionHistoryScoreChart } from "@/app/actions/[id]/history/components/ActionHistoryScoreChart";
import { ActionListItem } from "@/app/actions/components/ActionListItem";

export default async function ActionsPage({ searchParams }: PageParams) {
  const user = await getCurrentUser();
  const userId = user.id;

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
    orderBy: {
      TrainingExerciseScore: { _count: "desc" },
    },
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
      ActionLoss: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
      TrainingExerciseScore: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { Exercise: true },
      },
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
            {user.role === UserRole.ADMIN && (
              <Link className="btn btn-light" href={`/actions/create`}>
                Добавить движение
              </Link>
            )}
          </div>
        </form>
      </div>
      {actions.length ? (
        <>
          {actions.map((a) => (
            <ActionListItem action={a} key={a.id} />
          ))}
        </>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
