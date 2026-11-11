import { Purpose } from "@prisma/client";

// Цвет закреплен за группой мышц, а не за порядком в выборке: одна и та же
// группа должна читаться одинаково во всех тренировках и на всех экранах.
const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Грудь: "#d64545",
  Плечи: "#7c4dff",
  Спина: "#0f8b8d",
  Поясница: "#8d6e3a",
  Руки: "#1c6dd0",
  Ноги: "#43a047",
  Кора: "#00acc1",
  Живот: "#ef6c00",
  Шея: "#c2185b",
};

const FALLBACK_COLORS = [
  "#5c6bc0",
  "#26a69a",
  "#ec407a",
  "#7cb342",
  "#ffa726",
  "#8d6e63",
];

export function muscleGroupColor(title: string): string {
  const known = MUSCLE_GROUP_COLORS[title];
  if (known) return known;

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export const PURPOSE_COLORS: Record<Purpose, string> = {
  [Purpose.STRENGTH]: "#1c6dd0",
  [Purpose.MASS]: "#d97706",
  [Purpose.LOSS]: "#2e9e4f",
};

export const RECORD_COLOR = "#c8901a";
export const LOAD_REST_COLOR = "#ced4da";