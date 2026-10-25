import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { CheckupForm } from "@/app/checkup/components/CheckupForm";

type Props = {
  trainingId: number;
  trainingStarted: boolean;
};

export async function CheckupPanel({ trainingId, trainingStarted }: Props) {
  if (trainingStarted) return null;

  const userId = await getCurrentUserId();
  const userInfo = await prisma.userInfo.findFirst({
    where: { userId },
    select: { checkupsEnabled: true, isEmployed: true },
  });

  if (!userInfo?.checkupsEnabled) return null;

  const existingCheckup = await prisma.checkup.findUnique({
    where: { trainingId },
  });

  if (existingCheckup) return null;

  return (
    <CheckupForm trainingId={trainingId} isEmployed={userInfo.isEmployed} />
  );
}
