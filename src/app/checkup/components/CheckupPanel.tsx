import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { CheckupForm } from "@/app/checkup/components/CheckupForm";
import moment from "moment";

type Props = {
  trainingId: number;
  trainingStarted: boolean;
  plannedTo: Date;
};

export async function CheckupPanel({
  trainingId,
  trainingStarted,
  plannedTo,
}: Props) {
  if (trainingStarted) return null;

  // Анкета показывается только в день самой тренировки
  if (!moment(plannedTo).isSame(moment(), "day")) return null;

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
