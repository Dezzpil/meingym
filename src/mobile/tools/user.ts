import { prisma } from "@/tools/db";
import { ActionRequire, ActionRig, Prisma } from "@prisma/client";

export type MobileUserInfoDTO = {
  sex: string;
  height: number;
  purpose: string;
  trainingProgression: string;
  trainingProgressionParams: unknown;
  collectExerciseExecutionFeedback: boolean;
};

export type MobileUserDTO = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  userInfo: MobileUserInfoDTO | null;
};

// Поля профиля, которые безопасно отдавать в мобильный API (пароль намеренно исключён).
const BASE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  image: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

const USER_INFO_SELECT = {
  sex: true,
  height: true,
  purpose: true,
  trainingProgression: true,
  trainingProgressionParams: true,
  collectExerciseExecutionFeedback: true,
} as const;

const USER_SELECT = {
  ...BASE_USER_SELECT,
  UserInfo: { select: USER_INFO_SELECT, take: 1 },
} as const;

type RawMobileUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

function mapMobileUser(user: RawMobileUser): MobileUserDTO {
  const info = user.UserInfo[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    userInfo: info
      ? {
          sex: info.sex,
          height: info.height,
          purpose: info.purpose,
          trainingProgression: info.trainingProgression,
          trainingProgressionParams: info.trainingProgressionParams,
          collectExerciseExecutionFeedback: info.collectExerciseExecutionFeedback,
        }
      : null,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findMobileUserByEmail(email: string): Promise<MobileUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: USER_SELECT,
  });

  return user ? mapMobileUser(user) : null;
}

export async function findMobileUserById(userId: string): Promise<MobileUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  return user ? mapMobileUser(user) : null;
}

export async function createMobileUser(email: string, name?: string): Promise<MobileUserDTO> {
  const normalized = normalizeEmail(email);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: normalized, name: name || null },
      select: BASE_USER_SELECT,
    });

    const userInfo = await tx.userInfo.create({
      data: { userId: user.id },
      select: USER_INFO_SELECT,
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

    return mapMobileUser({ ...user, UserInfo: [userInfo] });
  });
}
