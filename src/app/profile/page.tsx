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

  const { gte, lt } = getCurrentDayBorders();
  const weight = await prisma.weight.findFirst({
    where: {
      userId,
      createdAt: { gte, lt },
    },
  });
  const weights = await prisma.weight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <>
      <h1>Профиль </h1>
      <ProfileForm userInfo={userInfo} />
      {weight ? <WeightPanel weight={weight} /> : <WeightsForm />}
      {weights && <WeightsChart weights={weights} />}
      <hr />
      <h3>Достижения</h3>
      <div>...</div>
      <hr />
      <Link className="btn btn-outline-danger" href={"/api/auth/signout"}>
        Выйти
      </Link>
    </>
  );
}
