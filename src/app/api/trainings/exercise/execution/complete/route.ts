import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import type {
  ExecutionBurning,
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
} from "@prisma/client";

type Data = {
  id: number;
  liftedWeight: number;
  liftedCount: number;
  rating: ExecutionRating;
  cheating: ExecutionCheating;
  refusing: ExecutionRefusing;
  burning: ExecutionBurning;
};

export async function POST(request: NextRequest) {
  const { id, liftedCount, liftedWeight, rating, cheating, refusing, burning } =
    (await request.json()) as Data;
  const exec = await prisma.trainingExerciseExecution.update({
    where: { id },
    data: {
      liftedWeight,
      liftedCount,
      rating,
      cheating,
      refusing,
      burning,
      executedAt: new Date(),
    },
  });
  return NextResponse.json(exec, { status: 200 });
}
