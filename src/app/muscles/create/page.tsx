import MusclesForm from "@/app/muscles/form";
import { prisma } from "@/tools/db";

export default async function MusclesCreatePage() {
  const groups = await prisma.muscleGroup.findMany();

  return (
    <>
      <header className="mb-3">Добавление описания мышц</header>
      <MusclesForm groups={groups} />
    </>
  );
}
