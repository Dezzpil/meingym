import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { notFound } from "next/navigation";
import EquipmentForm from "../components/EquipmentForm";
import { EquipmentFormFieldsType } from "@/app/equipment/types";

type Props = { params: { id: string } };

export default async function EquipmentEditPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const userId = await getCurrentUserId();

  const eq = await prisma.equipment.findFirst({
    where: { id, userId },
    include: { Requires: true, Rigs: true },
  });
  if (!eq) notFound();

  const initial: EquipmentFormFieldsType = {
    name: eq.name,
    isDefault: eq.isDefault,
    requires: eq.Requires.map((r) => r.type),
    rigs: eq.Rigs.map((r) => ({
      type: r.type,
      enabled: true,
      minWeight: Number(r.minWeight),
      step: Number(r.step),
      maxWeight: Number(r.maxWeight),
    })),
  };

  return (
    <>
      <h3 className="mb-3">Редактирование набора</h3>
      <EquipmentForm id={eq.id} initial={initial} />
    </>
  );
}
