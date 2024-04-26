import { ExecutionRating } from "@prisma/client";

export const RatingOptions = {
  [ExecutionRating.EASY]: "Легко / Не почувствовал нагрузки",
  [ExecutionRating.OK]: "ОК / ровно / качественно",
  [ExecutionRating.TENSION_OK]: "Напряжение, техника сохранена",
  [ExecutionRating.TENSION_FLAW]: "Напряжение, техника нарушилась",
  [ExecutionRating.HARD]: "Сразу тяжело",
};
