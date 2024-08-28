import { prisma } from "@/tools/db";
import { ActionControl } from "@/app/actions/[id]/control";
import ActionForm from "@/app/actions/components/ActionForm";
import Link from "next/link";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { ItemPageParams } from "@/tools/types";

export default async function ActionPage({ params }: ItemPageParams) {
  const user = await getCurrentUser();
  const id = parseInt(params.id);

  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      MusclesSynergy: true,
      MusclesAgony: true,
      MusclesStabilizer: true,
      TrainingExercise: true,
    },
  });
  const muscles = await prisma.muscle.findMany({
    include: { Group: true },
    orderBy: { groupId: "asc" },
  });

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      <ul className="nav nav-tabs mb-2">
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">
            Редактирование
          </a>
        </li>
        <li className="nav-item">
          <Link href={`/actions/${id}/state`} className="nav-link">
            Подходы
          </Link>
        </li>
        <li className="nav-item">
          <Link href={`/actions/${id}/history`} className="nav-link">
            История
          </Link>
        </li>
      </ul>
      {user.role !== UserRole.ADMIN && (
        <ActionControl
          action={action}
          trainingsCount={action.TrainingExercise.length}
        />
      )}
      <ActionForm
        action={action}
        muscles={muscles}
        control={user.role === UserRole.ADMIN}
      />
    </>
  );
}
