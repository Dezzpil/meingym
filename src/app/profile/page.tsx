import { prisma } from "@/tools/db";
import { WeightPanel } from "@/app/weights/panel";
import { WeightsForm } from "@/app/weights/form";
import { authOptions } from "@/tools/auth";
import { getCurrentDayBorders } from "@/tools/dates";
import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/404`);

  // @ts-ignore
  const user = session?.user;
  // @ts-ignore
  const userId = user.id;

  const { gte, lt } = getCurrentDayBorders();
  const weight = await prisma.weight.findFirst({
    where: {
      userId,
      createdAt: { gte, lt },
    },
  });

  return (
    <>
      <h1>Профиль </h1>
      {weight ? <WeightPanel weight={weight} /> : <WeightsForm />}
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
