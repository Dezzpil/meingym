import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import type { ExecutionRating } from "@prisma/client";

type Data = {
  id: number;
  liftedWeight: number;
  liftedCount: number;
  rating: ExecutionRating;
};

export async function POST(request: NextRequest) {
  const { id, liftedCount, liftedWeight, rating } =
    (await request.json()) as Data;
  const exec = await prisma.trainingExerciseExecution.update({
    where: { id },
    // @ts-ignore
    data: { liftedWeight, liftedCount, rating, executedAt: new Date() },
  });
  return NextResponse.json(exec, { status: 200 });
}
