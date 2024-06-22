import { prisma } from "@/tools/db";
import { ActionControl } from "@/app/actions/[id]/control";
import ActionForm from "@/app/actions/components/ActionForm";
import Link from "next/link";

type PageParams = {
  params: { id: string };
};

export default async function ActionPage({ params }: PageParams) {
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
      </ul>
      <ActionControl
        action={action}
        trainingsCount={action.TrainingExercise.length}
      />
      <ActionForm action={action} muscles={muscles} />
    </>
  );
}
