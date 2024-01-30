import MusclesGroupsButtons from "@/app/musclesgroups/[id]/buttons";
import { prisma } from "@/tools/db";

type Props = {
  params: { id: string };
};

export default async function MusclesGroupsIdPage({ params }: Props) {
  const id = parseInt(params.id);
  const group = await prisma.muscleGroup.findUniqueOrThrow({ where: { id } });
  return (
    <>
      <header className="mb-3">Мышечная группа {group.title}</header>
      <MusclesGroupsButtons id={group.id} />
    </>
  );
}
