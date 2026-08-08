import { prisma } from "@/tools/db";

const PAGE_SIZE = 20;
export const MAX_BATCH_SIZE = 50;

// --- DTO Types ---

export type MobileWeightDTO = {
  id: number;
  value: number;
  createdAt: string;
};

export type MobileWeightsResponse = {
  meta: {
    total: number;
    nextCursor: number | null;
  };
  items: MobileWeightDTO[];
};

export type MobileWeightInput = {
  value: number;
  createdAt?: string;
};

// --- GET: list weights with since filter + cursor pagination ---

export async function getWeightsList(
  userId: string,
  since: Date,
  cursor?: number,
): Promise<MobileWeightsResponse> {
  const where = {
    userId,
    createdAt: { gte: since },
    ...(cursor ? { id: { gt: cursor } } : {}),
  };

  const [weights, total] = await Promise.all([
    prisma.weight.findMany({
      where,
      take: PAGE_SIZE + 1,
      orderBy: { id: "asc" },
    }),
    prisma.weight.count({
      where: { userId, createdAt: { gte: since } },
    }),
  ]);

  const hasMore = weights.length > PAGE_SIZE;
  const items = hasMore ? weights.slice(0, PAGE_SIZE) : weights;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const dtos: MobileWeightDTO[] = items.map((w) => ({
    id: w.id,
    value: w.value,
    createdAt: w.createdAt.toISOString(),
  }));

  return { meta: { total, nextCursor }, items: dtos };
}

// --- POST: batch insert weights ---

export async function createWeightsBatch(
  userId: string,
  inputs: MobileWeightInput[],
): Promise<{ created: number }> {
  const result = await prisma.weight.createMany({
    data: inputs.map((item) => ({
      userId,
      value: item.value,
      ...(item.createdAt ? { createdAt: new Date(item.createdAt) } : {}),
    })),
  });

  return { created: result.count };
}
