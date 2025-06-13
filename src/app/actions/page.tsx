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
import { ActionFilterForm } from "@/app/actions/components/ActionFilterForm";

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

  // Calculate counts for each filter option
  const allActionsCount = await prisma.action.count();

  // Calculate counts for each muscle group
  const groupCounts: Record<number, number> = {};
  for (const group of groups) {
    const count = await prisma.action.count({
      where: {
        MusclesAgony: { some: { Muscle: { groupId: group.id } } },
      },
    });
    groupCounts[group.id] = count;
  }

  const actions = await prisma.action.findMany({
    where,
    orderBy: {
      TrainingExerciseScore: { _count: "desc" },
    },
    include: {
      ExerciseImages: {
        where: { isMain: true },
        take: 1,
      },
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
      <div className="mb-2">
        <ActionFilterForm
          groups={groups}
          initialGroupId={groupId}
          initialStrengthAllowed={strengthAllowed}
          groupCounts={groupCounts}
          allGroupsCount={allActionsCount}
        />
      </div>
      {actions.length ? (
        <>
          <div className="mb-2 d-flex gap-3 align-items-baseline">
            <p className="text-muted">Упражнений: {actions.length}</p>
            {user.role === UserRole.ADMIN && (
              <Link href={`/actions/create`}>Добавить</Link>
            )}
          </div>
          <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
            {actions.map((a) => (
              <ActionListItem action={a} key={a.id} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
