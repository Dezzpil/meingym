import { Purpose } from "@prisma/client";
import type { Training } from "@prisma/client";
import { PurposeName } from "@/tools/purposes";

export type TrainingStatus = "planned" | "active" | "done" | "missed";

export type PurposeShare = {
  purpose: Purpose;
  title: string;
  share: number;
  isMain: boolean;
};

type StatusFields = Pick<Training, "plannedTo" | "startedAt" | "completedAt">;

const PURPOSE_ORDER: Purpose[] = [
  Purpose.STRENGTH,
  Purpose.MASS,
  Purpose.LOSS,
];

export function topMuscleGroups(
  counts: Record<string, number>,
  limit = 2,
): string[] {
  return Object.entries(counts)
    .filter(([, cnt]) => cnt > 0)
    .sort(([titleA, a], [titleB, b]) =>
      b !== a ? b - a : titleA.localeCompare(titleB, "ru"),
    )
    .slice(0, limit)
    .map(([title]) => title);
}

export function resolveTrainingStatus(
  training: StatusFields,
  now: Date,
): TrainingStatus {
  if (training.completedAt) return "done";
  if (training.startedAt) return "active";

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return new Date(training.plannedTo) >= startOfToday ? "planned" : "missed";
}

export function computePurposeShares(purposes: Purpose[]): PurposeShare[] {
  if (!purposes.length) return [];

  const counters = new Map<Purpose, number>();
  for (const purpose of purposes) {
    counters.set(purpose, (counters.get(purpose) ?? 0) + 1);
  }

  return PURPOSE_ORDER.filter((purpose) => counters.has(purpose))
    .map((purpose) => ({ purpose, cnt: counters.get(purpose)! }))
    .sort((a, b) => b.cnt - a.cnt)
    .map(({ purpose, cnt }, index) => ({
      purpose,
      title: PurposeName[purpose],
      share: Math.round((cnt / purposes.length) * 100),
      isMain: index === 0,
    }));
}

export type TrainingVolume = {
  tonnageKg: number;
  reps: number;
};

export function sumTrainingVolume(
  exercises: { liftedSum: number; liftedCountTotal: number }[],
): TrainingVolume {
  return exercises.reduce<TrainingVolume>(
    (acc, e) => ({
      tonnageKg: acc.tonnageKg + (e.liftedSum || 0),
      reps: acc.reps + (e.liftedCountTotal || 0),
    }),
    { tonnageKg: 0, reps: 0 },
  );
}

export function formatTonnage(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
  return `${Math.round(kg)} кг`;
}

export type MuscleLoadInput = {
  title: string;
  plannedLoad: number;
  executedLoad: number;
  agonyCnt: number;
};

export type MuscleLoadSegment = {
  title: string;
  value: number;
  share: number;
};

export type MuscleLoadBreakdown = {
  segments: MuscleLoadSegment[];
  restShare: number;
  restCnt: number;
  rest: MuscleLoadSegment[];
  // load — посчитанная нагрузка, count — запасной вариант, когда пересчёта ещё не было
  basis: "load" | "count";
};

export function computeMuscleLoadBreakdown(
  loads: MuscleLoadInput[],
  options: { executed: boolean; limit?: number },
): MuscleLoadBreakdown {
  const { executed, limit = 3 } = options;
  const empty: MuscleLoadBreakdown = {
    segments: [],
    restShare: 0,
    restCnt: 0,
    rest: [],
    basis: "load",
  };
  if (!loads.length) return empty;

  const loadKey = executed ? "executedLoad" : "plannedLoad";
  const hasLoad = loads.some((l) => l[loadKey] > 0);
  const basis: MuscleLoadBreakdown["basis"] = hasLoad ? "load" : "count";
  const valueOf = (l: MuscleLoadInput) => (hasLoad ? l[loadKey] : l.agonyCnt);

  const total = loads.reduce((sum, l) => sum + Math.max(valueOf(l), 0), 0);
  if (total <= 0) return { ...empty, basis };

  const ordered = loads
    .filter((l) => valueOf(l) > 0)
    .sort((a, b) => {
      const diff = valueOf(b) - valueOf(a);
      return diff !== 0 ? diff : a.title.localeCompare(b.title, "ru");
    });

  const toSegment = (l: MuscleLoadInput): MuscleLoadSegment => ({
    title: l.title,
    value: valueOf(l),
    share: (valueOf(l) / total) * 100,
  });

  const head = ordered.slice(0, limit).map(toSegment);
  const tail = ordered.slice(limit).map(toSegment);

  return {
    segments: head,
    restShare: tail.reduce((sum, s) => sum + s.share, 0),
    restCnt: tail.length,
    rest: tail,
    basis,
  };
}