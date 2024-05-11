import MuscleForm from "@/app/muscles/components/MuscleForm";
import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { MuscleDescForm } from "@/app/muscles/[id]/components/MuscleDescForm";
import { MuscleInActions } from "@/app/muscles/[id]/components/MuscleInActions";

export default async function MusclePage({ params }: ItemPageParams) {
  const groups = await prisma.muscleGroup.findMany();
  const muscle = await prisma.muscle.findUniqueOrThrow({
    where: { id: parseInt(params.id) },
    include: {
      MuscleDesc: { orderBy: { createdAt: "asc" } },
      AgonyInActions: { include: { Action: true } },
      SynergyInActions: { include: { Action: true } },
    },
  });

  return (
    <>
      <header className="mb-3">
        {muscle.title} <b>мышца</b>
      </header>
      <MuscleInActions muscle={muscle} />
      <MuscleForm groups={groups} muscle={muscle} />
      {muscle.MuscleDesc.map((desc) => (
        <MuscleDescForm muscle={muscle} desc={desc} key={desc.id} />
      ))}
      <MuscleDescForm muscle={muscle} />
    </>
  );
}
