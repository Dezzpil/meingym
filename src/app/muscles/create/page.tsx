import MusclesForm from "@/app/muscles/form";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default async function MusclesCreatePage() {
  const groups = await prisma.muscleGroup.findMany();

  return (
    <>
      <header className="mb-3">Добавление описания мышц</header>
      <MusclesForm groups={groups} />
    </>
  );
}
