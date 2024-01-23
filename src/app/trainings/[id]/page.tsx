import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const training = await prisma.training.findUniqueOrThrow({
    where: { id },
  });
  return (
    <>
      <header className="mb-3">
        Тренировка {training.planedTo.toString()}
      </header>
      <p>Список упражнений</p>
    </>
  );
}
