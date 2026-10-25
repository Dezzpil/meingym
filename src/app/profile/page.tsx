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
import { CheckupChart } from "./components/CheckupChart";
import { SorenessChart, SorenessChartData } from "./components/SorenessChart";

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

  const currentPeriod = await getCurrentTrainingPeriod(userId);
  const progressionOpts = currentPeriod
    ? await prisma.progressionStrategySimpleOpts.findUnique({
        where: { trainingPeriodId: currentPeriod.id },
      })
    : null;

  const checkups = await prisma.checkup.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      createdAt: true,
      sleep: true,
      nutrition: true,
      preWorkout: true,
      stress: true,
      burnoutScore: true,
    },
  });

  // Крепатура: последние 20 записей с данными по мышцам
  const sorenessRecords = await prisma.muscleSoreness.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      Entries: {
        include: {
          Muscle: {
            select: { groupId: true, Group: { select: { title: true } } },
          },
        },
      },
    },
  });

  // Агрегируем по группам мышц: средняя интенсивность
  const groupMap = new Map<number, { title: string; intensities: number[] }>();
  for (const record of sorenessRecords) {
    for (const entry of record.Entries) {
      const groupId = entry.Muscle.groupId;
      const existing = groupMap.get(groupId);
      const intensityValue =
        entry.intensity === "NONE"
          ? 0
          : entry.intensity === "LIGHT"
            ? 1
            : entry.intensity === "MODERATE"
              ? 2
              : 3;
      if (existing) {
        existing.intensities.push(intensityValue);
      } else {
        groupMap.set(groupId, {
          title: entry.Muscle.Group.title,
          intensities: [intensityValue],
        });
      }
    }
  }

  const sorenessChartData: SorenessChartData[] = Array.from(
    groupMap.entries(),
  ).map(([groupId, data]) => ({
    muscleGroupId: groupId,
    groupTitle: data.title,
    avgIntensity:
      data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length,
    count: data.intensities.length,
  }));

  return (
    <>
      <h1>Профиль </h1>
      <ProfileForm userInfo={userInfo} />
      {progressionOpts && <SimpleProgressionOptsForm item={progressionOpts} />}
      <TrainingPeriodManager currentPeriod={currentPeriod} userId={userId} />
      {checkups.length > 0 && <CheckupChart checkups={checkups} />}
      {sorenessChartData.length > 0 && (
        <>
          <hr className="my-4" />
          <SorenessChart data={sorenessChartData} />
        </>
      )}
      <div>
        <h5>Управление</h5>
        <div className="mb-3 d-flex gap-2 justify-content-start">
          <Link className="btn btn-outline-primary" href="/onboarding">
            Пройти онбоардинг
          </Link>
          <Link className="btn btn-outline-danger" href={"/api/auth/signout"}>
            Выйти
          </Link>
        </div>
      </div>
    </>
  );
}
