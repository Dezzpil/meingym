export function getCurrentDayBorders(): { gte: Date; lt: Date } {
  const now = new Date();
  const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { gte, lt };
}

export const DateFormat = "Y-MM-DD";
export const TimeFormat = "HH:mm";

const SHORT_MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const SHORT_WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

// moment в проекте живёт с локалью en, а русские названия дней и месяцев
// нужны в компактных списках, где полная дата не помещается
export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}, ${SHORT_WEEKDAYS[d.getDay()]}`;
}
