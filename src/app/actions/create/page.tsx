import { PrismaClient } from "@prisma/client";
import ActionsForm from "@/app/actions/form";

const prisma = new PrismaClient();

export default async function ActionsCreatePage() {
  const muscles = await prisma.muscle.findMany();
  return (
    <>
      <header className="mb-3">Добавить новое движение</header>
      <ActionsForm muscles={muscles}></ActionsForm>
    </>
  );
}
