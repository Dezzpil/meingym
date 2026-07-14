import { prisma } from "@/tools/db";
import { ActionRequire, ActionRig } from "@prisma/client";

export type MobileUserDTO = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
};

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  image: true,
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findMobileUserByEmail(email: string): Promise<MobileUserDTO | null> {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: USER_SELECT,
  });
}

export async function findMobileUserById(userId: string): Promise<MobileUserDTO | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
}

export async function createMobileUser(email: string, name?: string): Promise<MobileUserDTO> {
  const normalized = normalizeEmail(email);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: normalized, name: name || null },
      select: USER_SELECT,
    });

    await tx.userInfo.create({
      data: { userId: user.id },
    });

    await tx.equipment.create({
      data: {
        userId: user.id,
        name: "Тренажерный зал",
        isDefault: true,
        Rigs: {
          createMany: {
            data: [
              { type: ActionRig.BARBELL, minWeight: 10, step: 5, maxWeight: 200 },
              { type: ActionRig.BLOCKS, minWeight: 5, step: 1, maxWeight: 200 },
              { type: ActionRig.DUMBBELL, minWeight: 5, step: 2.5, maxWeight: 50 },
              { type: ActionRig.KETTLEBELL, minWeight: 6, step: 2, maxWeight: 30 },
            ],
          },
        },
        Requires: {
          createMany: {
            data: [
              { type: ActionRequire.BENCH },
              { type: ActionRequire.UPBAR },
              { type: ActionRequire.SIMULATOR },
            ],
          },
        },
      },
    });

    return user;
  });
}
