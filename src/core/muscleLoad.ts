import { norm, scoreNormalized } from "@/core/scores";
import { createHash } from "node:crypto";
import type { Purpose } from "@prisma/client";

/**
 * Вклад мышцы в нагрузку группы по её роли в движении.
 * Стабилизаторы не учитываем: их вклад в «нить» динамики только шумит.
 * Коэффициенты совпадают с определением `Action.base`, чтобы нагрузка нити
 * и линия сложности тренировки не расходились.
 */
export const MUSCLE_LOAD_ROLE_COEFFS = { agony: 0.7, synergy: 0.3 } as const;

export type LoadMuscle = { groupId: number; sizeFactor: number };

export type LiftedStats = {
  liftedSum: number;
  liftedMean: number;
  liftedMax: number;
  liftedCountTotal: number;
  liftedCountMean: number;
};

export type ExerciseLoadInput = {
  /** Плановая сложность упражнения */
  planned: number;
  /** Фактическая сложность упражнения, 0 если выполнять нечего */
  executed: number;
  agony: LoadMuscle[];
  synergy: LoadMuscle[];
};

export type GroupLoad = {
  groupId: number;
  planned: number;
  executed: number;
  agonyCnt: number;
  synergyCnt: number;
};

/**
 * Подпись тренировки «про одно и то же»: набор agonist-групп мышц.
 * Тренировки одного типа получают одинаковую подпись — по ней ищем предыдущую
 * тренировку той же направленности. null — если агонистов нет.
 */
export function buildMuscleSignature(
  agonistGroupIds: number[],
): string | null {
  const ids = Array.from(new Set(agonistGroupIds)).sort((a, b) => a - b);
  if (!ids.length) return null;
  return createHash("sha1")
    .update(ids.join(","))
    .digest("hex");
}

/**
 * Сложность упражнения по фактическим подъёмам.
 * Возвращает 0, когда данных о выполнении нет, — это «нет информации», а не «было легко».
 */
export function executedExerciseDifficulty(
  base: number,
  lifted: LiftedStats,
  purpose: Purpose,
): number {
  if (lifted.liftedSum <= 0 && lifted.liftedCountTotal <= 0) return 0;
  return base * scoreNormalized(purpose, norm(lifted)).score;
}

/**
 * Доли нагрузки упражнения по группам мышц. Веса нормированы к 1, поэтому сумма
 * plannedLoad по всем группам равна сложности тренировки, а executedLoad — её фактической версии.
 */
export function distributeExerciseLoad(
  input: ExerciseLoadInput,
): GroupLoad[] {
  const acc = new Map<
    number,
    { weight: number; agonyCnt: number; synergyCnt: number }
  >();

  const touch = (muscle: LoadMuscle, role: keyof typeof MUSCLE_LOAD_ROLE_COEFFS) => {
    let item = acc.get(muscle.groupId);
    if (!item) {
      item = { weight: 0, agonyCnt: 0, synergyCnt: 0 };
      acc.set(muscle.groupId, item);
    }
    item.weight += muscle.sizeFactor * MUSCLE_LOAD_ROLE_COEFFS[role];
    if (role === "agony") item.agonyCnt += 1;
    else item.synergyCnt += 1;
  };

  for (const muscle of input.agony) touch(muscle, "agony");
  for (const muscle of input.synergy) touch(muscle, "synergy");

  const totalWeight = Array.from(acc.values()).reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  if (totalWeight <= 0) return [];

  return Array.from(acc.entries()).map(([groupId, item]) => {
    const share = item.weight / totalWeight;
    return {
      groupId,
      planned: share * input.planned,
      executed: share * input.executed,
      agonyCnt: item.agonyCnt,
      synergyCnt: item.synergyCnt,
    };
  });
}
