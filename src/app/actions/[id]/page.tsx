// @ts-ignore
import ActionsForm from "@/app/actions/form";
import { ApproachesManagement } from "@/components/approaches/Managment";
import { prisma } from "@/tools/db";

type PageParams = {
  params: { id: string };
};

export default async function ActionPage({ params }: PageParams) {
  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      CurrentApproachGroup: { include: { Approaches: true } },
      MusclesSynergy: true,
      MusclesAgony: true,
    },
  });
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });
  const lastGroup = action.CurrentApproachGroup;

  return (
    <>
      <header className="mb-3">Движение ID {id}</header>
      <ActionsForm action={action} muscles={muscles}></ActionsForm>
      <hr />
      {lastGroup && (
        <ApproachesManagement
          groupId={lastGroup.id}
          approaches={lastGroup.Approaches}
        />
      )}
    </>
  );
}
