import { prisma } from "@/tools/db";
import { ActionControl } from "@/app/actions/[id]/control";
import ActionForm from "@/app/actions/components/ActionForm";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { ItemPageParams } from "@/tools/types";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { redirect } from "next/navigation";

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
      MusclesAgony: true,
      MusclesStabilizer: true,
      TrainingExercise: true,
      ExerciseImages: true,
    },
  });
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
        control={user.role === UserRole.ADMIN}
      />
    </>
  );
}
