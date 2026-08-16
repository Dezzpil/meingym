import { PersonalRecordType, type Purpose } from "@prisma/client";
import type { RecordCandidate } from "./types";
import {
  filterRecordableExecutions,
  valuateMaxWeight,
  valuateVolume,
  type RecordableExecution,
} from "./valuation";

/**
 * Оценивает выполнения упражнения тренировки и возвращает кандидатов
 * на рекорды обоих типов (MAX_WEIGHT и MAX_VOLUME).
 */
export function buildRecordCandidates(params: {
  userId: string;
  trainingId: number;
  trainingExerciseId: number;
  actionId: number;
  purpose: Purpose;
  periodId: number | null;
  achievedAt: Date;
  executions: RecordableExecution[];
  approaches: { id: number; isBoost: boolean }[];
}): RecordCandidate[] {
  const valued = filterRecordableExecutions(
    params.executions,
    params.approaches,
  );
  if (!valued.length) return [];

  const base = {
    userId: params.userId,
    actionId: params.actionId,
    purpose: params.purpose,
    trainingId: params.trainingId,
    trainingExerciseId: params.trainingExerciseId,
    periodId: params.periodId,
    achievedAt: params.achievedAt,
  };

  const candidates: RecordCandidate[] = [];

  const maxWeight = valuateMaxWeight(valued);
  if (maxWeight) {
    candidates.push({
      ...base,
      type: PersonalRecordType.MAX_WEIGHT,
      value: maxWeight.value,
      reps: maxWeight.reps,
    });
  }

  const volume = valuateVolume(valued);
  if (volume !== null) {
    candidates.push({
      ...base,
      type: PersonalRecordType.MAX_VOLUME,
      value: volume,
      reps: null,
    });
  }

  return candidates;
}
