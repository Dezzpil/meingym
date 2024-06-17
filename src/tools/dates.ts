export function getCurrentDayBorders(): { gte: Date; lt: Date } {
  const now = new Date();
  const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { gte, lt };
}

export const DateFormat = "Y-MM-DD";
export const TimeFormat = "HH:mm";
