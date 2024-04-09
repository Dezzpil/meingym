import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";

type Data = {
  id: number;
};

export async function POST(request: NextRequest) {
  const { id } = (await request.json()) as Data;
  await prisma.trainingExerciseExecution.update({
    where: { id },
    data: { executedAt: null },
  });
  return NextResponse.json({}, { status: 200 });
}
