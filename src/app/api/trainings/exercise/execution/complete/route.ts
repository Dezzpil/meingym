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
  rating?: ExecutionRating | null;
  technique?: ExecutionTechnique | null;
  techniqueUpgrade?: boolean | null;
  cheating?: ExecutionCheating | null;
  refusing?: ExecutionRefusing | null;
  burning?: ExecutionBurning | null;
  comment?: string | null;
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
