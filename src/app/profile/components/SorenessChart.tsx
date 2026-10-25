"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SorenessIntensity } from "@prisma/client";

export type SorenessChartData = {
  muscleGroupId: number;
  groupTitle: string;
  avgIntensity: number;
  count: number;
};

type Props = {
  data: SorenessChartData[];
};

const INTENSITY_LABELS: Record<number, string> = {
  0: "Нет",
  1: "Лёгкая",
  2: "Умеренная",
  3: "Сильная",
};

export function SorenessChart({ data }: Props) {
  if (data.length === 0) return null;

  const sortedData = data
    .filter((d) => d.avgIntensity > 0)
    .sort((a, b) => b.avgIntensity - a.avgIntensity);

  if (sortedData.length === 0) return null;

  return (
    <div className="mb-4">
      <h6>Крепатура по группам мышц</h6>
      <p className="text-muted small">
        Средняя интенсивность за последние тренировки
      </p>
      <ResponsiveContainer width="100%" height={Math.max(200, sortedData.length * 40)}>
        <BarChart data={sortedData} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v) => INTENSITY_LABELS[v] ?? ""}
          />
          <YAxis type="category" dataKey="groupTitle" width={90} />
          <Tooltip
            formatter={(value: number) => [
              `${value.toFixed(1)} (${INTENSITY_LABELS[Math.round(value)] ?? "Нет"})`,
              "Средняя интенсивность",
            ]}
            labelFormatter={(label) => `Группа: ${label}`}
          />
          <Bar dataKey="avgIntensity" fill="#8884d8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
