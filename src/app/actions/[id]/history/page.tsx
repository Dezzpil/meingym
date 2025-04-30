import { ItemPageParams } from "@/tools/types";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import { Purpose } from "@prisma/client";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { Suspense } from "react";
import { ActionHistoryScores } from "@/app/actions/[id]/history/components/ActionHistoryScores";
import { DataRows } from "@/core/scores";

export type ActionHistoryData = {
  id: number;
  completedAt: Date | null;
  purpose: Purpose;
  liftedCountTotal: number;
  liftedMean: number;
  liftedSum: number;
  maxWeight: number;
  extended?: Record<keyof DataRows, number> & {
    score: number;
    scoreUp: boolean;
  };
};

export default async function ActionHistoryPage({ params }: ItemPageParams) {
  const userId = await getCurrentUserId();

  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
  });
  const scores = await prisma.trainingExerciseScore.findMany({
    where: { actionId: id, userId },
    orderBy: { createdAt: "desc" },
    include: {
      Exercise: true,
    },
  });

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      <ActionTabs id={id} current={"history"} className={"mb-2"} />
      <div className="mb-2">
        <Suspense fallback={<div>Загрузка данных...</div>}>
          <ActionHistoryScores scores={scores} />
        </Suspense>
      </div>
    </>
  );
}
