export function convert<T>(items: T[], keys: Array<keyof T>) {
  const r = {};
  for (const item of items) {
    for (const key of keys) {
      // @ts-ignore
      if (!r[key]) r[key] = [];
      // @ts-ignore
      r[key].push(item[key]);
    }
  }
  return r as Record<keyof T, number[]>;
}

export function normMinMax(vals: number[], min: number, max: number): number[] {
  // X_normalized = (X - X_min) / (X_max - X_min)

  const norm = [];
  if (vals) {
    for (const val of vals) {
      min = Math.min(min, val);
      max = Math.max(max, val);
    }
    for (const val of vals) {
      norm.push((val - min) / (max - min));
    }
  }
  return norm;
}

export function normLog(vals: number[]): number[] {
  const norm = [];
  if (vals) {
    for (const val of vals) {
      norm.push(val > 0 ? Math.log(val) : 0);
    }
  }
  return norm;
}
