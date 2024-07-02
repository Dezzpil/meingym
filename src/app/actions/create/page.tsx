import { ActionCreateForm } from "@/app/actions/components/ActionCreateForm";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
import { redirect } from "next/navigation";

export default async function ActionsCreatePage() {
  const user = await getCurrentUser();
  if (user.role !== UserRole.ADMIN) {
    redirect(`/404`);
  }
  return (
    <>
      <header className="mb-3">Добавить новое движение</header>
      <ActionCreateForm />
    </>
  );
}
