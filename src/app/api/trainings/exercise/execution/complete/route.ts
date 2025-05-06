import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import type {
  ExecutionBurning,
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
  ExecutionTechnique,
} from "@prisma/client";

export type TrainingsExerciseCompleteDTO = {
  id: number;
  liftedWeight: number;
  liftedCount: number;
  rating?: ExecutionRating;
  technique?: ExecutionTechnique;
  techniqueUpgrade: boolean;
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
    technique,
    techniqueUpgrade,
    refusing,
    burning,
    comment,
  } = (await request.json()) as TrainingsExerciseCompleteDTO;

  let isPassed = false;
  if (!liftedCount) {
    isPassed = true;
  }

  const exec = await prisma.trainingExerciseExecution.update({
    where: { id },
    data: {
      liftedWeight,
      liftedCount: !liftedCount ? 0 : liftedCount,
      rating,
      cheating,
      refusing,
      burning,
      executedAt: new Date(),
      comment,
      technique,
      techniqueUpgrade,
      isPassed,
    },
  });
  return NextResponse.json(exec, { status: 200 });
}
