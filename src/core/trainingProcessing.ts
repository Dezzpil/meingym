import { prisma } from "@/tools/db";
import {
  ApproachData,
  ApproachExecutedData,
  createApproachGroup,
  linkNewApproachGroupToActionByPurpose,
} from "@/core/approaches";
import {
  Action,
  ApproachesGroup,
  Purpose,
  TrainingExerciseExecution,
  TrainingProgression,
  Approach,
} from "@prisma/client";
import type { TrainingExercise } from "@prisma/client";
import { findUserInfo } from "@/tools/auth";
import { ProgressionStrategySimple } from "@/core/progression/strategy/simple";
import { detectPersonalRecordsForTraining } from "@/core/records";
import { scheduleScoreCalculation } from "@/jobs";

function isBoostExecution(
  execution: { approachId: number | null },
  approaches: { id: number; isBoost: boolean }[],
): boolean {
  if (!execution.approachId) return false;
  const approach = approaches.find((a) => a.id === execution.approachId);
  return approach?.isBoost ?? false;
}

export async function processCompletedTrainingCore(
  trainingId: number,
  userId: string,
): Promise<void> {
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

  // 1) Рассчитаем длительность выполнения каждого подхода по всей тренировке
  // Получаем список выполнений по тренировки, отсортированный по executedAt
  const executionsOrdered = await prisma.trainingExerciseExecution.findMany({
    where: {
      Exercise: { trainingId },
      executedAt: { not: null },
      isPassed: false,
    },
    orderBy: { executedAt: "asc" },
    select: { id: true, exerciseId: true, executedAt: true },
  });
  if (training.startedAt && executionsOrdered.length > 0) {
    let prev = training.startedAt as Date;
    const rows = executionsOrdered.map((e, idx) => {
      const diffMs = (e.executedAt as Date).getTime() - prev.getTime();
      const seconds = Math.max(0, Math.round(diffMs / 1000));
      prev = e.executedAt as Date;
      return {
        trainingId,
        trainingExerciseId: e.exerciseId,
        executionId: e.id,
        sequence: idx + 1, // порядковый номер последовательности (1..n)
        seconds,
      };
    });
    await prisma.$transaction(async (tx) => {
      // Удалим старые данные если они есть, чтобы не было дублей
      await tx.trainingExerciseExecutionDuration.deleteMany({
        where: { trainingId },
      });
      if (rows.length) {
        await tx.trainingExerciseExecutionDuration.createMany({ data: rows });
      }
    });
  }

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
        if (approach.isBoost) continue; // Skip boost approaches from progression
        plannedSetsData.push({
          count: approach.count,
          weight: approach.weight,
          priority: approach.priority,
        });
      }

      // игнорируем пропущенные подходы или подходы с 0 нагрузкой
      const executedSetsData: ApproachExecutedData[] =
        exercise.TrainingExerciseExecution.filter(
          (e) => !e.isPassed && e.liftedCount > 0 && !isBoostExecution(e, exercise.ApproachGroup.Approaches),
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

  // 2) Зафиксируем персональные рекорды (не зависит от настройки прогрессии)
  await detectPersonalRecordsForTraining(trainingId, userId);

  await prisma.training.update({
    where: { id: trainingId },
    data: { processedAt: new Date() },
  });
}
