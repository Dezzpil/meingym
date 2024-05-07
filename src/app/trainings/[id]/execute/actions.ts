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
import { PrismaTransactionClient } from "@/tools/types";
import {
  Purpose,
  TrainingExercise,
  TrainingExerciseExecution,
} from "@prisma/client";
import { getCurrentUserId } from "@/tools/auth";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";

export async function handleTrainingStart(id: number) {
  await prisma.training.update({
    where: { id },
    data: { startedAt: new Date() },
  });
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
  exerciseId: number,
  data: Record<string, { liftedCount: number; liftedWeight: number }>,
  trainingId: number,
  actionId: number,
) {
  await prisma.trainingExerciseExecution.updateMany({
    where: { exerciseId, executedAt: null },
    data: { isPassed: true },
  });

  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    const executions = await tx.trainingExerciseExecution.findMany({
      where: { exerciseId, isPassed: false },
    });

    const sets: SetData[] = executions.map((e) => {
      return { weight: e.liftedWeight, count: e.liftedCount };
    });
    const info = await findInfoForCalculationStatsForAction(
      actionId,
      userId,
      tx,
    );
    const { sum: liftedSum, mean: liftedMean } = calculateStats(
      sets,
      info.actionrig,
      info.userweight,
    );

    await tx.trainingExercise.update({
      where: { id: exerciseId },
      data: { completedAt: new Date(), liftedSum, liftedMean },
    });
  });

  await prisma.$transaction(async (tx) => {
    await checkAllExercisesCompletedAndCompleteTraining(trainingId, tx);
  });

  revalidatePath(`/trainings/${exerciseId}/execute`);
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
  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: {
      TrainingExercise: {
        include: {
          TrainingExerciseExecution: { orderBy: { priority: "asc" } },
        },
      },
    },
  });
  if (!training.completedAt) {
    throw new Error(`Тренировка еще не завершена`);
  }
  if (training.processedAt) return;

  await prisma.$transaction(async (tx) => {
    // пересоздадим подходы, из которых будет собираться следующая тренировка?
    for (const e of training.TrainingExercise) {
      const exercise = e as TrainingExercise & {
        TrainingExerciseExecution: TrainingExerciseExecution[];
      };
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
        // Если хотя бы один подход был выполнен, то рассчитываем прогрессию
        // и обновляем нагрузку на будущее. Иначе просто оставляем ту нагрузку, что была
        let upgradedSetsData: ApproachData[] = [];

        const rigs = await tx.rig.findMany({ where: { userId } });
        const action = await tx.action.findUniqueOrThrow({
          where: { id: exercise.actionId },
        });
        const strategy = new ProgressionStrategySimple(rigs, action);
        if (exercise.purpose === Purpose.MASS) {
          upgradedSetsData = strategy.mass(
            [],
            executedSetsData,
          ) as ApproachData[];
        } else {
          upgradedSetsData = strategy.strength(
            [],
            executedSetsData,
          ) as ApproachData[];
        }
        upgradedSetsData.forEach((set, i) => (set.priority = i));

        const approachGroupFromExecution = await createApproachGroup(
          tx,
          upgradedSetsData,
          exercise.actionId,
          training.userId,
        );
        await linkNewApproachGroupToActionByPurpose(
          tx,
          exercise.purpose,
          exercise.purposeId,
          approachGroupFromExecution,
        );
      }
    }

    await tx.training.update({
      where: { id: trainingId },
      data: { processedAt: new Date() },
    });
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
