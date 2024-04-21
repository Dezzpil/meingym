import MusclesForm from "@/app/muscles/form";
import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { MuscleDescForm } from "@/app/muscles/[id]/components/descForm";
import Link from "next/link";

export default async function MusclePage({ params }: ItemPageParams) {
  const groups = await prisma.muscleGroup.findMany();
  const muscle = await prisma.muscle.findUniqueOrThrow({
    where: { id: parseInt(params.id) },
    include: {
      MuscleDesc: { orderBy: { createdAt: "asc" } },
      AgonyInActions: { include: { Action: true } },
    },
  });

  return (
    <>
      <header className="mb-3">
        {muscle.title} <b>мышца</b>
      </header>
      {muscle.AgonyInActions.length ? (
        <>
          <header>Агонист в упражнениях</header>
          <ul className="list-group mb-3">
            {muscle.AgonyInActions.map((a) => (
              <li className="list-group-item hstack gap-5" key={a.actionId}>
                <Link href={`/actions/${a.actionId}`}>{a.Action.title}</Link>
                <span className="badge text-bg-light rounded-pill">
                  {a.Action.rig}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted mb-3">Нет движений, задействующих мышцу</p>
      )}
      <MusclesForm groups={groups} muscle={muscle} />
      {muscle.MuscleDesc.map((desc) => (
        <MuscleDescForm muscle={muscle} desc={desc} key={desc.id} />
      ))}
      <MuscleDescForm muscle={muscle} />
    </>
  );
}
