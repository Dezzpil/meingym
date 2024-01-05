import { PrismaClient } from "@prisma/client";
import MusclesGroupsButtons from "@/app/musclesgroups/[id]/buttons";

type Props = {
  params: { id: string };
};

const prisma = new PrismaClient();

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
