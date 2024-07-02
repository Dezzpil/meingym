import MusclesGroupsCreateForm from "@/app/musclesgroups/create/form";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { redirect } from "next/navigation";

export default async function MusclesGroupsCreatePage() {
  const user = await getCurrentUser();
  if (user.role !== UserRole.ADMIN) {
    redirect(`/404`);
  }
  return (
    <>
      <header className="mb-3">Добавление мышечной группы</header>
      <MusclesGroupsCreateForm />
    </>
  );
}
