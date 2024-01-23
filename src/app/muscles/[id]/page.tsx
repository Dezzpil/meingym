// @ts-ignore
import MusclesForm from "@/app/muscles/form";
import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";

export default async function MusclePage({ params }: ItemPageParams) {
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
