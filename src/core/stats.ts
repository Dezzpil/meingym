import { SetData, SetsStats } from "@/core/types";

export function calculateStats(setsData: Array<SetData>): SetsStats {
  const count = setsData.length;
  let sum = 0,
    mean = 0;
  for (const a of setsData) {
    if (a.weight * a.count > 0) {
      sum += a.weight * a.count;
      mean += a.weight / a.count;
    }
  }
  mean = mean / count;
  return { count, sum, mean };
}
