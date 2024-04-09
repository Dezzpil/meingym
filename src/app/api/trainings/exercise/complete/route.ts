import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";

type Data = {
  id: number;
  liftedWeight: number;
  liftedCount: number;
};

export async function POST(request: NextRequest) {
  const { id, liftedCount, liftedWeight } = (await request.json()) as Data;

  const exec = await prisma.trainingExerciseExecution.update({
    where: { id },
    // @ts-ignore
    data: { liftedWeight, liftedCount, executedAt: new Date() },
  });
  return NextResponse.json(exec, { status: 200 });
}
