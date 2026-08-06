import { prisma } from "@/tools/db";
import { createExercise } from "@/core/exercises";
import { createApproachGroup } from "@/core/approaches";
import type { ApproachData } from "@/core/approaches";
import { CurrentPurpose } from "@/core/types";
import { scheduleTrainingProcessing } from "@/jobs";

export type MobileSyncExecutionInput = {
  priority: number;
  plannedWeight: number;
  plannedCount: number;
  liftedWeight: number;
  liftedCount: number;
  isPassed?: boolean;
  rating?: string;
  technique?: string;
  cheating?: string;
  refusing?: string;
  burning?: string;
  executedAt?: string | null;
  extraCount?: number;
  useBelt?: boolean;
  techniqueUpgrade?: boolean;
  comment?: string | null;
};

export type MobileSyncExerciseInput = {
  actionId: number;
  priority: number;
  purpose: "MASS" | "STRENGTH" | "LOSS";
  isPassed: boolean;
  rating?: "EASY" | "OK" | "HARD" | "IMPOSSIBLE";
  comment?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  approaches: { priority: number; weight: number; count: number; isBoost?: boolean }[];
  executions: MobileSyncExecutionInput[];
};

export type MobileSyncTrainingInput = {
  externalId: string;
  plannedTo: string;
  startedAt?: string | null;
  completedAt?: string | null;
  isCircuit?: boolean;
  noWarmUp?: boolean;
  noFeedback?: boolean;
  equipmentId?: number | null;
  commonComment?: string | null;
  completeComment?: string | null;
  periodId?: number | null;
  repeatedFromId?: number | null;
  exercises: MobileSyncExerciseInput[];
};

export type SyncResult = {
  externalId: string;
  status: "created" | "updated" | "skipped" | "error";
  trainingId?: number;
  reason?: string;
  error?: string;
};

export const MAX_BATCH_SIZE = 20;

export async function syncTrainingsBatch(
  userId: string,
  inputs: MobileSyncTrainingInput[],
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const input of inputs) {
    try {
      const existing = await prisma.training.findFirst({
        where: { userId, externalId: input.externalId },
      });

      if (existing && existing.completedAt !== null) {
        results.push({
          externalId: input.externalId,
          status: "skipped",
          reason: "already_completed",
        });
        continue;
      }

      const trainingId = await prisma.$transaction(async (tx) => {
        let trainingId: number;

        if (existing) {
          // Update path: delete children first
          await tx.trainingExercise.deleteMany({ where: { trainingId: existing.id } });
          await tx.trainingMuscleStat.deleteMany({ where: { trainingId: existing.id } });
          await tx.trainingExerciseExecutionDuration.deleteMany({ where: { trainingId: existing.id } });
          await tx.trainingWarmUp.deleteMany({ where: { trainingId: existing.id } });

          await tx.training.update({
            where: { id: existing.id },
            data: {
              plannedTo: new Date(input.plannedTo),
              startedAt: input.startedAt ? new Date(input.startedAt) : null,
              completedAt: input.completedAt ? new Date(input.completedAt) : null,
              isCircuit: input.isCircuit ?? false,
              noWarmUp: input.noWarmUp ?? false,
              noFeedback: input.noFeedback ?? false,
              equipmentId: input.equipmentId ?? null,
              commonComment: input.commonComment ?? null,
              completeComment: input.completeComment ?? null,
              periodId: input.periodId ?? null,
              repeatedFromId: input.repeatedFromId ?? null,
              syncedFromMobile: true,
            },
          });

          trainingId = existing.id;
        } else {
          // Create path
          const created = await tx.training.create({
            data: {
              userId,
              externalId: input.externalId,
              plannedTo: new Date(input.plannedTo),
              startedAt: input.startedAt ? new Date(input.startedAt) : null,
              completedAt: input.completedAt ? new Date(input.completedAt) : null,
              isCircuit: input.isCircuit ?? false,
              noWarmUp: input.noWarmUp ?? false,
              noFeedback: input.noFeedback ?? false,
              equipmentId: input.equipmentId ?? null,
              commonComment: input.commonComment ?? null,
              completeComment: input.completeComment ?? null,
              periodId: input.periodId ?? null,
              repeatedFromId: input.repeatedFromId ?? null,
              syncedFromMobile: true,
            },
          });

          trainingId = created.id;
        }

        // Create exercises and executions
        for (const exercise of input.exercises) {
          const createdExercise = await createExercise(
            trainingId,
            exercise.actionId,
            exercise.purpose as CurrentPurpose,
            userId,
            tx,
          );

          // Update exercise with payload fields
          await tx.trainingExercise.update({
            where: { id: createdExercise.id },
            data: {
              isPassed: exercise.isPassed,
              rating: (exercise.rating as any) ?? "OK",
              comment: exercise.comment ?? null,
              startedAt: exercise.startedAt ? new Date(exercise.startedAt) : null,
              completedAt: exercise.completedAt ? new Date(exercise.completedAt) : null,
            },
          });

          // If the payload has approaches, create a new approach group and link the exercise to it
          if (exercise.approaches && exercise.approaches.length > 0) {
            const newGroup = await createApproachGroup(
              tx,
              exercise.approaches.map((a) => ({
                priority: a.priority,
                weight: a.weight,
                count: a.count,
                isBoost: a.isBoost ?? false,
              })) as ApproachData[],
              exercise.actionId,
              userId,
            );
            await tx.trainingExercise.update({
              where: { id: createdExercise.id },
              data: { approachGroupId: newGroup.id },
            });
          }

          // Create executions
          if (exercise.executions.length > 0) {
            await tx.trainingExerciseExecution.createMany({
              data: exercise.executions.map((e) => ({
                exerciseId: createdExercise.id,
                plannedWeigth: e.plannedWeight,
                plannedCount: e.plannedCount,
                liftedWeight: e.liftedWeight,
                liftedCount: e.liftedCount,
                isPassed: e.isPassed ?? false,
                priority: e.priority,
                rating: (e.rating as any) ?? "OK",
                technique: (e.technique as any) ?? "OK",
                cheating: (e.cheating as any) ?? "NO",
                refusing: (e.refusing as any) ?? "NO",
                burning: (e.burning as any) ?? "NO",
                executedAt: e.executedAt ? new Date(e.executedAt) : null,
                extraCount: e.extraCount ?? 0,
                useBelt: e.useBelt ?? false,
                techniqueUpgrade: e.techniqueUpgrade ?? false,
                comment: e.comment ?? null,
              })),
            });
          }
        }

        return trainingId;
      });

      // After transaction commits, check if processing is needed
      const training = await prisma.training.findUnique({
        where: { id: trainingId },
        select: { processedAt: true, completedAt: true },
      });

      if (training && training.completedAt && !training.processedAt) {
        await scheduleTrainingProcessing(trainingId, userId);
      }

      results.push({
        externalId: input.externalId,
        status: existing ? "updated" : "created",
        trainingId,
      });
    } catch (error: any) {
      console.error(`Error syncing training ${input.externalId}:`, error);
      results.push({
        externalId: input.externalId,
        status: "error",
        error: error.message,
      });
    }
  }

  return results;
}
