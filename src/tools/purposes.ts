import { Purpose } from "@prisma/client";

export const PurposeName = {
  [Purpose.MASS]: "На массу",
  [Purpose.STRENGTH]: "На силу",
  [Purpose.LOSS]: "На снижение веса",
};

export const PurposeShortName = {
  [Purpose.MASS]: "Масса",
  [Purpose.STRENGTH]: "Сила",
  [Purpose.LOSS]: "Рельеф",
};
