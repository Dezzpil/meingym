import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { getTrainingAwaitingSoreness } from "@/app/soreness/actions";
import { SorenessForm } from "@/app/soreness/components/SorenessForm";

export async function SorenessPrompt() {
  const userId = await getCurrentUserId();
  const userInfo = await prisma.userInfo.findFirst({
    where: { userId },
    select: { sorenessEnabled: true },
  });

  if (!userInfo?.sorenessEnabled) return null;

  const training = await getTrainingAwaitingSoreness();
  if (!training) return null;

  return <SorenessForm training={training} />;
}
