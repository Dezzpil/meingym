import { cache } from "react";
import { prisma } from "@/tools/db";

// Кешируем запрос групп мышц в рамках одного запроса (React Server Component request deduplication)
export const getCachedMuscleGroups = cache(() =>
  prisma.muscleGroup.findMany({})
);
