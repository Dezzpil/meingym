import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!params.has("id")) {
    return NextResponse.json({}, { status: 404 });
  }

  const id = +(params.get("id") as string);
  const exercise = await prisma.trainingExercise.findUnique({
    where: { id },
    include: { Training: true },
  });

  const scores = await prisma.trainingExerciseScore.findMany({
    where: {
      userId: exercise!.Training.userId,
      purpose: exercise!.purpose,
      actionId: exercise!.actionId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const result = { values: [] as number[], regress: 0, currentIndex: 0 };
  scores.reverse();
  for (let i = 0; i < scores.length; i++) {
    if (scores[i].trainingExerciseId === id) {
      result.currentIndex = i;
    }
    result.values.push(scores[i].score);
    if (i <= result.currentIndex) {
      if (i > 0) result.regress = result.values[i] - result.values[i - 1];
    }
  }

  console.log(result);
  return NextResponse.json(result, { status: 200 });
}
