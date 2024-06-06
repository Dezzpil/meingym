import {
  ExecutionRating,
  ExecutionCheating,
  ExecutionRefusing,
  ExecutionBurning,
  ExecutionTechnique,
} from "@prisma/client";

export const RatingOptions = {
  [ExecutionRating.EASY]: "Легко / Не почувствовал нагрузки",
  [ExecutionRating.OK]: "ОК / ровно / качественно",
  [ExecutionRating.TENSION]: "Напряжение / тяжело, но получается",
  [ExecutionRating.HARD]: "Сразу тяжело / еле получилось",
};

export const TechniqueOptions = {
  [ExecutionTechnique.OK]: "Техника ОК",
  [ExecutionTechnique.FLAW]: "Техника нарушилась",
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
