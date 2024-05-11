import MuscleForm from "@/app/muscles/components/MuscleForm";
import { prisma } from "@/tools/db";

export default async function MusclesCreatePage() {
  const groups = await prisma.muscleGroup.findMany();

  return (
    <>
      <header className="mb-3">Добавление описания мышц</header>
      <MuscleForm groups={groups} />
    </>
  );
}
