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
import { BiPlus } from "react-icons/bi";
import React from "react";

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
          {user.role === UserRole.ADMIN && (
            <Link
              href={`/actions/create`}
              className="btn btn-primary rounded-circle position-fixed d-inline-flex align-items-center justify-content-center"
              title="Добавить упражнение"
              aria-label="Добавить упражнение"
              style={{
                width: 56,
                height: 56,
                right: 16,
                bottom: 16,
                zIndex: 1050,
                boxShadow: "0 0.5rem 1rem rgba(0,0,0,.15)",
              }}
            >
              <BiPlus size={28} />
            </Link>
          )}
          <div className="">
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
