import { prisma } from "@/tools/db";
import { getPlannedToStr } from "@/tools/dates";

export default async function HomePage() {
  const trainings = await prisma.training.findMany({
    where: {
      completedAt: null,
      plannedToStr: getPlannedToStr(new Date()),
    },
    orderBy: {
      plannedTo: "asc",
    },
  });

  return <p></p>;
}
