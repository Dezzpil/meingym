import ActionsForm from "@/app/actions/form";
import { prisma } from "@/tools/db";

export default async function ActionsCreatePage() {
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });
  return (
    <>
      <header className="mb-3">Добавить новое движение</header>
      <ActionsForm muscles={muscles}></ActionsForm>
    </>
  );
}
