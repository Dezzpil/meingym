import MuscleForm from "@/app/muscles/components/MuscleForm";
import { prisma } from "@/tools/db";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { redirect } from "next/navigation";

export default async function MusclesCreatePage() {
  const user = await getCurrentUser();
  if (user.role !== UserRole.ADMIN) {
    redirect(`/404`);
  }

  const groups = await prisma.muscleGroup.findMany();

  return (
    <>
      <header className="mb-3">Добавление описания мышц</header>
      <MuscleForm groups={groups} />
    </>
  );
}
