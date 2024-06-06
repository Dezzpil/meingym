import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import type {
  ExecutionBurning,
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
} from "@prisma/client";

export type TrainingsExerciseCompleteDTO = {
  id: number;
  liftedWeight: number;
  liftedCount: number;
  rating?: ExecutionRating;
  cheating?: ExecutionCheating;
  refusing?: ExecutionRefusing;
  burning?: ExecutionBurning;
  comment?: string;
};

export async function POST(request: NextRequest) {
  const {
    id,
    liftedCount,
    liftedWeight,
    rating,
    cheating,
    refusing,
    burning,
    comment,
  } = (await request.json()) as TrainingsExerciseCompleteDTO;
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
      comment,
    },
  });
  return NextResponse.json(exec, { status: 200 });
}
