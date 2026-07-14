import { prisma } from "@/tools/db";

const PAGE_SIZE = 20;

export type MobileExerciseDTO = {
  id: number;
  title: string;
  desc: string;
  alias: string | null;
  anotherTitles: string | null;
  isMarkDownInDesc: boolean;
  strengthAllowed: boolean;
  bigCount: boolean;
  allowCheating: boolean;
  oneDumbbell: boolean;
  base: number;
  rig: string;
  require: string;
  createdAt: string;
  updatedAt: string;
  muscles: {
    agonists: number[];
    synergists: number[];
    stabilizers: number[];
    antagonists: number[];
  };
  similarActionIds: number[];
  mainImage: string | null;
};

export async function getExercisesList(
  cursor?: number
): Promise<{ data: MobileExerciseDTO[]; nextCursor: number | null }> {
  const actions = await prisma.action.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { where: { id: { gt: cursor } } } : {}),
    orderBy: { id: "asc" },
    include: {
      MusclesAgony: { select: { muscleId: true } },
      MusclesSynergy: { select: { muscleId: true } },
      MusclesStabilizer: { select: { muscleId: true } },
      MusclesAntagonist: { select: { muscleId: true } },
      SimilarTo: { select: { actionId: true } },
      SimilarFrom: { select: { similarActionId: true } },
      ExerciseImages: { where: { isMain: true }, select: { path: true }, take: 1 },
    },
  });

  const hasMore = actions.length > PAGE_SIZE;
  const items = hasMore ? actions.slice(0, PAGE_SIZE) : actions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const data: MobileExerciseDTO[] = items.map((action) => ({
    id: action.id,
    title: action.title,
    desc: action.desc,
    alias: action.alias,
    anotherTitles: action.anotherTitles,
    isMarkDownInDesc: action.isMarkDownInDesc,
    strengthAllowed: action.strengthAllowed,
    bigCount: action.bigCount,
    allowCheating: action.allowCheating,
    oneDumbbell: action.oneDumbbell,
    base: action.base,
    rig: action.rig,
    require: action.require,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
    muscles: {
      agonists: action.MusclesAgony.map((m) => m.muscleId),
      synergists: action.MusclesSynergy.map((m) => m.muscleId),
      stabilizers: action.MusclesStabilizer.map((m) => m.muscleId),
      antagonists: action.MusclesAntagonist.map((m) => m.muscleId),
    },
    similarActionIds: [
      ...action.SimilarFrom.map((s) => s.similarActionId),
      ...action.SimilarTo.map((s) => s.actionId),
    ],
    mainImage: action.ExerciseImages[0]?.path ?? null,
  }));

  return { data, nextCursor };
}
