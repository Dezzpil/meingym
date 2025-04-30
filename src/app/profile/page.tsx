import { prisma } from "@/tools/db";
import { WeightPanel } from "@/app/weights/panel";
import { WeightsForm } from "@/app/weights/form";
import { authOptions } from "@/tools/auth";
import { getCurrentDayBorders } from "@/tools/dates";
import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/app/profile/components/ProfileForm";
import type { UserInfo } from "@prisma/client";
import { WeightsChart } from "./components/WeightsChart";
import TrainingPeriodManager from "@/app/trainings/components/TrainingPeriodManager";
import {
  getCurrentTrainingPeriod,
  getCurrentTrainingPeriodWithOptions,
} from "@/core/periods";
import { SimpleProgressionOptsForm } from "@/app/progression/SimpleProgressionOptsForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/404`);

  // @ts-ignore
  const user = session?.user;
  // @ts-ignore
  const userId = user.id;

  const userInfo = (await prisma.userInfo.findFirst({
    where: { userId },
  })) as UserInfo;

  let progressionOpts = null;
  const currentPeriod = await getCurrentTrainingPeriod(userId);
  if (currentPeriod) {
    progressionOpts = await prisma.progressionStrategySimpleOpts.findUnique({
      where: { trainingPeriodId: currentPeriod.id },
    });
  }

  return (
    <>
      <h1>Профиль </h1>
      <ProfileForm userInfo={userInfo} />
      {progressionOpts && <SimpleProgressionOptsForm item={progressionOpts} />}
      <TrainingPeriodManager currentPeriod={currentPeriod} userId={userId} />
      <div>
        <h5>Управление</h5>
        <div className="mb-3 d-flex justify-content-start">
          <Link className="btn btn-outline-danger" href={"/api/auth/signout"}>
            Выйти
          </Link>
        </div>
      </div>
    </>
  );
}
