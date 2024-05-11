import MusclesGroupsButtons from "@/app/musclesgroups/[id]/components/buttons";
import { prisma } from "@/tools/db";
import { MuscleGroupsDescForm } from "@/app/musclesgroups/[id]/components/descForm";
import Link from "next/link";

type Props = {
  params: { id: string };
};

export default async function MusclesGroupsIdPage({ params }: Props) {
  const id = parseInt(params.id);
  const group = await prisma.muscleGroup.findUniqueOrThrow({
    where: { id },
    include: {
      MuscleGroupDesc: { orderBy: { createdAt: "asc" } },
      Muscle: {
        include: {
          AgonyInActions: true,
          SynergyInActions: true,
        },
      },
    },
  });
  return (
    <>
      <header className="mb-3">
        Мышечная группа <b>{group.title}</b>
      </header>
      {group.Muscle.length ? (
        <ul className="list-group mb-3">
          {group.Muscle.map((m) => (
            <li className="list-group-item hstack gap-5" key={m.id}>
              <Link href={`/muscles/${m.id}`}>{m.title}</Link>
              <span className="badge text-bg-primary">
                {m.AgonyInActions.length}
              </span>
              <span className="badge text-bg-primary">
                {m.SynergyInActions.length}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-muted">Мышцы еще не добавлены...</p>
      )}
      {group.MuscleGroupDesc.map((desc) => (
        <MuscleGroupsDescForm group={group} desc={desc} key={desc.id} />
      ))}
      <MuscleGroupsDescForm group={group} />
      <MusclesGroupsButtons id={group.id} />
    </>
  );
}
