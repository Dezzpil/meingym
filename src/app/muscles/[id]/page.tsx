// @ts-ignore
import MusclesForm from "@/app/muscles/form";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PageParams = {
  params: { id: string };
};

export default async function MusclePage({ params }: PageParams) {
  const groups = await prisma.muscleGroup.findMany();
  const muscle = await prisma.muscle.findUniqueOrThrow({
    where: { id: parseInt(params.id) },
  });

  return (
    <>
      <header className="mb-3">Мышца ID {muscle.id}</header>
      <MusclesForm groups={groups} muscle={muscle} />
    </>
  );
}
