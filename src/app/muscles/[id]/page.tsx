import MuscleForm from "@/app/muscles/components/MuscleForm";
import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { MuscleDescForm } from "@/app/muscles/[id]/components/MuscleDescForm";
import { MuscleInActions } from "@/app/muscles/[id]/components/MuscleInActions";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";

export default async function MusclePage({ params }: ItemPageParams) {
  const user = await getCurrentUser();
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
      <h2 className="mb-3">{muscle.title} мышца</h2>
      <MuscleInActions muscle={muscle} />
      <MuscleForm
        groups={groups}
        muscle={muscle}
        control={user.role === UserRole.ADMIN}
      />
      {muscle.MuscleDesc.map((desc) => (
        <MuscleDescForm
          muscle={muscle}
          desc={desc}
          key={desc.id}
          control={user.role === UserRole.ADMIN}
        />
      ))}
      {user.role === UserRole.ADMIN && <MuscleDescForm muscle={muscle} />}
    </>
  );
}
