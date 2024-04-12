import { z } from "zod";
export const WeightsFields = z.object({
  block: z.number({ description: "Вес блока в тренажерах" }),
  plateMin: z.number({ description: "Минимальный вес блина для штанги" }),
  barbellMin: z.number({ description: "Минимальный вес грифа штанги" }),
  dumbbellStep: z.number({ description: "Шаг веса гантелей" }),
});

export type WeightsFieldsType = z.infer<typeof WeightsFields>;
