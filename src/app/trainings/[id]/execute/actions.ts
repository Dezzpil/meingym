"use server";

import { prisma } from "@/tools/db";
import { revalidatePath } from "next/cache";
import { SetData } from "@/core/types";
import {
  calculateStats,
  findInfoForCalculationStatsForAction,
} from "@/core/stats";
import {
  ApproachData,
  ApproachExecutedData,
  createApproachGroup,
  linkNewApproachGroupToActionByPurpose,
} from "@/core/approaches";
import { PrismaTransactionClient, ServerActionResult } from "@/tools/types";
import {
  Action,
  ApproachesGroup,
  Purpose,
  TrainingExerciseExecution,
  TrainingProgression,
  Approach,
} from "@prisma/client";
import type { TrainingExercise, TrainingRating } from "@prisma/client";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";
import { scheduleScoreCalculation } from "@/jobs";
import { createTrainingPeriod, getCurrentTrainingPeriod } from "@/core/periods";

export async function handleTrainingStart(id: number, isCircuit: boolean) {
  const userId = await getCurrentUserId();

  let currentPeriod = await getCurrentTrainingPeriod(userId);
  if (!currentPeriod) {
    currentPeriod = await createTrainingPeriod(userId);
  }

  await prisma.training.update({
    where: { id },
    data: {
      startedAt: new Date(),
      periodId: currentPeriod.id,
    },
  });
  if (isCircuit) {
    await prisma.trainingExercise.updateMany({
      where: { trainingId: id },
      data: {
        startedAt: new Date(),
      },
    });
  }
  revalidatePath(`/trainings/${id}/execute`);
}

export async function handleTrainingExerciseStart(
  id: number,
  trainingId: number,
) {
  await prisma.trainingExercise.update({
    where: { id },
    data: { startedAt: new Date() },
  });
  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleTrainingExercisePass(
  id: number,
  trainingId: number,
) {
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.update({
      where: { id },
      data: { startedAt: new Date(), completedAt: new Date(), isPassed: true },
    });
  });

  await prisma.$transaction(async (tx) => {
    await checkAllExercisesCompletedAndCompleteTraining(trainingId, tx);
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function countExerciseNonExecuted(
  exerciseId: number,
): Promise<number> {
  return prisma.trainingExerciseExecution.count({
    where: { exerciseId, executedAt: null },
  });
}

export async function handleTrainingExerciseExecuted(
  exercise: Pick<TrainingExercise, "id" | "trainingId" | "actionId">,
  rating?: TrainingRating | null,
  comment?: string | null,
): Promise<ServerActionResult> {
  try {
    await prisma.trainingExerciseExecution.updateMany({
      where: {
        exerciseId: exercise.id,
        executedAt: null,
      },
      data: { isPassed: true },
    });

    const userId = await getCurrentUserId();
    await prisma.$transaction(async (tx) => {
      const executions = await tx.trainingExerciseExecution.findMany({
        where: { exerciseId: exercise.id, isPassed: false },
      });

      const sets: SetData[] = executions.map((e) => {
        return { weight: e.liftedWeight, count: e.liftedCount };
      });
      const info = await findInfoForCalculationStatsForAction(
        exercise.actionId,
        userId,
        tx,
      );
      const {
        weightSum: liftedSum,
        weightMean: liftedMean,
        countSum: liftedCountTotal,
        weightMax,
        countMean: liftedCountMean,
      } = calculateStats(sets, info.actionrig, info.userweight);

      await tx.trainingExercise.update({
        where: { id: exercise.id },
        data: Object.assign(
          {
            completedAt: new Date(),
            liftedSum,
            liftedMean,
            liftedCountTotal,
            liftedCountMean,
            liftedMax: weightMax,
          },
          rating ? { rating } : {},
          comment ? { comment } : {},
        ),
      });
    });
    await prisma.$transaction(async (tx) => {
      await checkAllExercisesCompletedAndCompleteTraining(
        exercise.trainingId,
        tx,
      );
    });
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  revalidatePath(`/trainings/${exercise.trainingId}/execute`);
  return { ok: true, error: null };
}

async function checkAllExercisesCompletedAndCompleteTraining(
  id: number,
  tx: PrismaTransactionClient,
): Promise<boolean> {
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
  });
  const notCompleted = exercises.filter((e) => !e.completedAt);
  if (notCompleted.length === 0) {
    await tx.training.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    console.log(`training ${id} completed`);
    return true;
  }
  return false;
}

export async function handleAddExecutionApproach(
  trainingId: number,
  exerciseId: number,
): Promise<void> {
  let plannedWeigth = 0;
  let plannedCount = 0;
  let priority = 1;
  const lastExecution = await prisma.trainingExerciseExecution.findFirst({
    where: { exerciseId },
    orderBy: { priority: "desc" },
  });
  if (lastExecution) {
    plannedWeigth = lastExecution.plannedWeigth;
    plannedCount = lastExecution.plannedCount;
    priority = lastExecution.priority + 1;
  }
  await prisma.trainingExerciseExecution.create({
    data: {
      exerciseId,
      plannedWeigth,
      plannedCount,
      priority,
      liftedCount: 0,
      liftedWeight: 0,
      approachId: null,
    },
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleProcessCompletedTraining(
  trainingId: number,
): Promise<void> {
  const userId = await getCurrentUserId();
  const userInfo = await findUserInfo(userId);

  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: {
      TrainingExercise: {
        include: {
          TrainingExerciseExecution: { orderBy: { priority: "asc" } },
          Action: true,
          ApproachGroup: {
            include: { Approaches: { orderBy: { priority: "asc" } } },
          },
        },
      },
      Period: {
        include: {
          ProgressionStrategySimpleOpts: true,
        },
      },
    },
  });
  if (!training.completedAt) {
    throw new Error(`Тренировка еще не завершена`);
  }
  if (training.processedAt) return;

  if (userInfo.trainingProgression !== TrainingProgression.NONE) {
    // пересоздадим подходы, из которых будет собираться следующая тренировка?
    for (const _exercise of training.TrainingExercise) {
      const exercise = _exercise as TrainingExercise & {
        Action: Action;
        TrainingExerciseExecution: TrainingExerciseExecution[];
        ApproachGroup: ApproachesGroup & { Approaches: Approach[] };
      };
      const plannedSetsData: ApproachData[] = [];
      for (const approach of exercise.ApproachGroup.Approaches) {
        plannedSetsData.push({
          count: approach.count,
          weight: approach.weight,
          priority: approach.priority,
        });
      }

      // игнорируем пропущенные подходы или подходы с 0 нагрузкой
      const executedSetsData: ApproachExecutedData[] =
        exercise.TrainingExerciseExecution.filter(
          (e) => !e.isPassed && e.liftedCount > 0,
        ).map((e) => {
          return {
            priority: e.priority,
            count: e.liftedCount,
            weight: e.liftedWeight,
            refusing: e.refusing,
            rating: e.rating,
            cheating: e.cheating,
            burning: e.burning,
          };
        });

      if (executedSetsData.length) {
        let upgradedSetsData: ApproachData[] = [];

        // Если хотя бы один подход был выполнен, то рассчитываем прогрессию
        // и обновляем нагрузку на будущее. Иначе просто оставляем ту нагрузку, что была
        let strategy = new ProgressionStrategySimple(
          exercise.Action,
          training.Period?.ProgressionStrategySimpleOpts,
        );

        // TODO рефакторинг
        if (exercise.purpose === Purpose.MASS) {
          upgradedSetsData = strategy.mass(
            plannedSetsData,
            executedSetsData,
          ) as ApproachData[];
        }
        if (exercise.purpose === Purpose.STRENGTH) {
          upgradedSetsData = strategy.strength(
            plannedSetsData,
            executedSetsData,
          ) as ApproachData[];
        }
        if (exercise.purpose === Purpose.LOSS) {
          upgradedSetsData = strategy.loss(
            plannedSetsData,
            executedSetsData,
          ) as ApproachData[];
        }
        upgradedSetsData.forEach((set, i) => (set.priority = i));
        await prisma.$transaction(async (tx) => {
          const newApproachGroupFromExecution = await createApproachGroup(
            tx,
            upgradedSetsData,
            exercise.actionId,
            userId,
          );
          await linkNewApproachGroupToActionByPurpose(
            tx,
            exercise.purpose,
            exercise.purposeId,
            newApproachGroupFromExecution,
          );
        });
      }
    }

    // Schedule score calculation job for this action
    await scheduleScoreCalculation(trainingId);
  }

  await prisma.training.update({
    where: { id: trainingId },
    data: { processedAt: new Date() },
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}

export async function handleCompleteTrainingManually(trainingId: number) {
  await prisma.$transaction(async (tx) => {
    await tx.trainingExercise.updateMany({
      where: { trainingId, completedAt: null },
      data: { completedAt: new Date(), isPassed: true },
    });
    await tx.training.update({
      where: { id: trainingId },
      data: { completedAt: new Date() },
    });
  });

  revalidatePath(`/trainings/${trainingId}/execute`);
}
