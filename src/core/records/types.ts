import type { PersonalRecordType, Purpose } from "@prisma/client";

// Последний рекорд связки (userId + actionId + purpose + type) на момент сравнения
export type LastRecordRef = {
  value: number;
  trainingId: number;
  achievedAt: Date;
};

// Результат упражнения тренировки, претендующий на рекорд
export type RecordCandidate = {
  userId: string;
  actionId: number;
  purpose: Purpose;
  type: PersonalRecordType;
  value: number;
  // повторы рекордного подхода — только для MAX_WEIGHT (показ «100 × 5»)
  reps: number | null;
  trainingId: number;
  trainingExerciseId: number;
  periodId: number | null;
  achievedAt: Date;
};

// Готовая к вставке запись PersonalRecord
export type NewPersonalRecordEntry = RecordCandidate & {
  isAllTime: boolean;
  previousValue: number | null;
  previousTrainingId: number | null;
  previousAt: Date | null;
};
