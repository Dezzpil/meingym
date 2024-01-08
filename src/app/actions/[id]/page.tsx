// @ts-ignore
import ActionsForm from "@/app/actions/form";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PageParams = {
  params: { id: string };
};

export default async function ActionPage({ params }: PageParams) {
  const id = parseInt(params.id);
  const action = await prisma.actions.findUniqueOrThrow({ where: { id } });
  const muscles = await prisma.muscle.findMany();

  return (
    <>
      <header className="mb-3">Движение ID {id}</header>
      <ActionsForm action={action} muscles={muscles}></ActionsForm>
    </>
  );
}
