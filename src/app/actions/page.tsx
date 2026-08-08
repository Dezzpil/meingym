import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCachedMuscleGroups } from "@/tools/cachedQueries";
import { getCurrentUser } from "@/tools/auth";
import { PageParams } from "@/tools/types";
import { Prisma, UserRole } from "@prisma/client";
import { ActionListItem } from "@/app/actions/components/ActionListItem";
import { ActionFilterForm } from "@/app/actions/components/ActionFilterForm";
import { BiPlus } from "react-icons/bi";
import React from "react";

export default async function ActionsPage({ searchParams }: PageParams) {
  const user = await getCurrentUser();

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

  const groups = await getCachedMuscleGroups();

  // Агрегирующие запросы выполняем параллельно
  const strengthFilter =
    strengthAllowed !== null
      ? Prisma.sql`WHERE a."strengthAllowed" = ${strengthAllowed}`
      : Prisma.empty;

  const [groupCountRows, allCountRows] = await Promise.all([
    prisma.$queryRaw<{ groupId: number; cnt: bigint }[]>`
      SELECT m."groupId", COUNT(DISTINCT a."id") as cnt
      FROM "Action" a
      JOIN "ActionsOnMusclesAgony" ama ON ama."actionId" = a."id"
      JOIN "Muscle" m ON m."id" = ama."muscleId"
      ${strengthFilter}
      GROUP BY m."groupId"
    `,
    prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(DISTINCT a."id") as cnt
      FROM "Action" a
      ${strengthFilter}
    `,
  ]);

  const groupCounts: Record<number, number> = {};
  for (const row of groupCountRows) {
    groupCounts[Number(row.groupId)] = Number(row.cnt);
  }
  const allActionsCount = Number(allCountRows[0]?.cnt ?? 0);

  const actions = await prisma.action.findMany({
    where,
    orderBy: {
      base: "desc",
    },
    include: {
      ExerciseImages: {
        where: { isMain: true },
        take: 1,
      },
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
      MusclesAntagonist: { include: { Muscle: { include: { Group: true } } } },
    },
  });

  return (
    <>
      <div className="mb-3">
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
          <div className="d-flex flex-wrap gap-3">
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
