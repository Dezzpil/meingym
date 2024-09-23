"use client";

import type { Weight } from ".prisma/client";
import moment from "moment/moment";
import { DateFormat } from "@/tools/dates";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CustomizedAxisTick } from "@/components/recharts/CustomizedAxisTick";

type Props = {
  weights: Weight[];
};

export function WeightsChart({ weights }: Props) {
  const data: Array<{ key: string; val: number }> = [];
  let [min, max] = [120, 0];
  weights.forEach((w) => {
    if (w.value < min) min = (Math.round(w.value / 10) - 0.5) * 10;
    if (w.value > max) max = (Math.round(w.value / 10) + 0.5) * 10;
    data.unshift({
      key: moment(w.createdAt).format(DateFormat),
      val: w.value,
    });
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart width={500} height={300} data={data}>
        <Line type="monotone" dataKey="val" stroke="#8884d8" name="Вес" />
        <XAxis dataKey="key" tick={<CustomizedAxisTick />} height={80} />
        <YAxis domain={[min - 5, max]} tickCount={10} height={300} />
        <Tooltip />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}
