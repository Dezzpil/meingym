import { prisma } from "@/tools/db";
import ActionForm from "@/app/actions/components/ActionForm";

export default async function ActionsCreatePage() {
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });
  return (
    <>
      <header className="mb-3">Добавить новое движение</header>
      <ActionForm muscles={muscles} />
    </>
  );
}
