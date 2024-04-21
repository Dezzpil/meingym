import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { WeightsForm } from "@/app/rigs/form";
import { WeightsFieldsType } from "@/app/rigs/types";
export default async function WeightsPage() {
  const userId = await getCurrentUserId();
  const weights = await prisma.rig.findMany({ where: { userId } });

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
