"use server";

import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { redirect } from "next/navigation";
import {
  EquipmentFormFields,
  EquipmentFormFieldsType,
} from "@/app/equipment/types";
import { ActionRig } from "@prisma/client";

async function assertOwner(equipmentId: number, userId: string) {
  const eq = await prisma.equipment.findFirst({
    where: { id: equipmentId, userId },
    select: { id: true },
  });
  if (!eq) throw new Error("Набор не найден");
}

export async function handleEquipmentCreate(data: EquipmentFormFieldsType) {
  const userId = await getCurrentUserId();
  console.log(data);
  const parsed = EquipmentFormFields.parse(data);

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx.equipment.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.equipment.create({
      data: {
        userId,
        name: parsed.name,
        isDefault: parsed.isDefault,
        Requires: {
          create: parsed.requires.map((type) => ({ type })),
        },
        Rigs: {
          create: parsed.rigs
            .filter(
              (r) =>
                r.enabled &&
                (r.type as string) !== "NONE" &&
                r.minWeight !== undefined &&
                r.step !== undefined,
            )
            .map((r) => ({
              type: r.type as ActionRig,
              minWeight: r.minWeight!,
              step: r.step!,
              maxWeight: r.maxWeight!,
            })),
        },
      },
    });
  });

  redirect(`/equipment/${created.id}`);
}

export async function handleEquipmentUpdate(
  id: number,
  data: EquipmentFormFieldsType,
) {
  const userId = await getCurrentUserId();
  await assertOwner(id, userId);
  const parsed = EquipmentFormFields.parse(data);

  await prisma.$transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx.equipment.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    await tx.equipment.update({
      where: { id },
      data: { name: parsed.name, isDefault: parsed.isDefault },
    });

    // полностью пересоздаём связанные записи — проще и безопаснее, чем дифф
    await tx.equipmentRequire.deleteMany({ where: { equipmentId: id } });
    await tx.equipmentRig.deleteMany({ where: { equipmentId: id } });

    if (parsed.requires.length) {
      await tx.equipmentRequire.createMany({
        data: parsed.requires.map((type) => ({ equipmentId: id, type })),
      });
    }
    const rigs = parsed.rigs.filter(
      (r) =>
        r.enabled &&
        (r.type as string) !== "NONE" &&
        r.minWeight !== undefined &&
        r.step !== undefined,
    );
    if (rigs.length) {
      console.log(rigs);
      await tx.equipmentRig.createMany({
        data: rigs.map((r) => ({
          equipmentId: id,
          type: r.type as ActionRig,
          minWeight: r.minWeight!,
          step: r.step!,
          maxWeight: r.maxWeight!,
        })),
      });
    }
  });

  redirect(`/equipment`);
}

export async function handleEquipmentDelete(id: number) {
  const userId = await getCurrentUserId();
  await assertOwner(id, userId);
  await prisma.equipment.delete({ where: { id } });
  redirect(`/equipment`);
}
