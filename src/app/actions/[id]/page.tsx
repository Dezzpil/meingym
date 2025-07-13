import { prisma } from "@/tools/db";
import { ActionControl } from "@/app/actions/[id]/control";
import ActionForm from "@/app/actions/components/ActionForm";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { ItemPageParams } from "@/tools/types";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export default async function ActionPage({ params }: ItemPageParams) {
  const user = await getCurrentUser();
  const id = parseInt(params.id);

  // If user is not admin, redirect to card page
  if (user.role !== UserRole.ADMIN) {
    redirect(`/actions/${id}/card`);
  }

  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      MusclesSynergy: true,
      MusclesAgony: { include: { Muscle: true } },
      MusclesStabilizer: true,
      TrainingExercise: true,
      ExerciseImages: true,
      SimilarFrom: true,
      SimilarTo: true,
    },
  });
  console.log(action.SimilarTo, action.SimilarFrom);
  // Fetch all actions for similar exercises dropdown
  const actionGroupIds = action.MusclesAgony.map((ma) => ma.Muscle.groupId);
  const similarActionsDto =
    (await prisma.$queryRaw`SELECT DISTINCT A.id, A.title from "Action" A
      LEFT JOIN "ActionsOnMusclesAgony" AOMA on A.id = AOMA."actionId"
      LEFT JOIN "Muscle" M on AOMA."muscleId" = M.id
  WHERE m."groupId" IN (${Prisma.join(actionGroupIds)}) AND A."id" != ${
    action.id
  };`) as unknown as {
      id: number;
      title: string;
    }[];

  const muscles = await prisma.muscle.findMany({
    include: { Group: true },
    orderBy: { groupId: "asc" },
  });

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      {user.role === UserRole.ADMIN && (
        <ActionTabs id={id} current={""} className={"mb-2"} />
      )}
      {user.role !== UserRole.ADMIN && (
        <ActionControl
          action={action}
          trainingsCount={action.TrainingExercise.length}
        />
      )}
      <ActionForm
        action={action}
        muscles={muscles}
        allowedSimilarActions={similarActionsDto}
        control={user.role === UserRole.ADMIN}
      />
    </>
  );
}
