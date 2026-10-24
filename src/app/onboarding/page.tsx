import { prisma } from "@/tools/db";
import { authOptions } from "@/tools/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { UserInfo } from "@prisma/client";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login`);

  // @ts-ignore
  const user = session?.user;
  // @ts-ignore
  const userId = user.id;

  const userInfo = (await prisma.userInfo.findFirst({
    where: { userId },
  })) as UserInfo;

  return (
    <div className="container py-5">
      <OnboardingWizard
        userId={userId}
        currentExperience={userInfo.trainingExperience}
        currentProfile={{
          height: userInfo.height,
          sex: userInfo.sex,
          purpose: userInfo.purpose,
        }}
        currentProgression={{
          type: userInfo.trainingProgression,
          params: userInfo.trainingProgressionParams,
        }}
      />
    </div>
  );
}
