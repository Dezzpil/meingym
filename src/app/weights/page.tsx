import { prisma } from "@/tools/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/tools/auth";
import { redirect } from "next/navigation";
import { WeightsForm } from "@/app/weights/form";
import { WeightsFieldsType } from "@/app/weights/types";
export default async function WeightsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/404`);

  // @ts-ignore
  const userId = session?.user.id;
  const weights = await prisma.weights.findMany({ where: { userId } });

  const values: WeightsFieldsType = {
    block: 5,
    plateMin: 2.5,
    barbellMin: 20,
    dumbbellStep: 2.5,
  };
  for (const weight of weights) {
    values[
      weight.code as "block" | "plateMin" | "barbellMin" | "dumbbellStep"
    ] = weight.value as number;
  }

  return (
    <div>
      <WeightsForm values={values} />
    </div>
  );
}
