import {
  ExecutionRating,
  ExecutionCheating,
  ExecutionRefusing,
  ExecutionBurning,
} from "@prisma/client";

export const RatingOptions = {
  [ExecutionRating.EASY]: "Легко / Не почувствовал нагрузки",
  [ExecutionRating.OK]: "ОК / ровно / качественно",
  [ExecutionRating.TENSION_OK]: "Напряжение, техника сохранена",
  [ExecutionRating.TENSION_FLAW]: "Напряжение, техника нарушилась",
  [ExecutionRating.HARD]: "Сразу тяжело",
};

export const CheatingOptions = {
  [ExecutionCheating.NO]: "Без читинга",
  [ExecutionCheating.PART]: "Частичный читинг",
  [ExecutionCheating.FULL]: "Полный читинг",
};

export const RefusingOptions = {
  [ExecutionRefusing.NO]: "Без отказа",
  [ExecutionRefusing.SOON]: "Близость отказа",
  [ExecutionRefusing.YES]: "Отказ",
};

export const BurningOptions = {
  [ExecutionBurning.NO]: "Без жжения мышцах",
  [ExecutionBurning.YES]: "Жжение в мышцах",
};
