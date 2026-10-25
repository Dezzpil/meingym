"use client";

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

type CheckupData = {
  createdAt: Date;
  sleep: number;
  nutrition: number;
  preWorkout: number;
  stress: number;
  burnoutScore: number | null;
};

type Props = {
  checkups: CheckupData[];
};

export function CheckupChart({ checkups }: Props) {
  const data = checkups
    .slice()
    .reverse()
    .map((c) => ({
      key: moment(c.createdAt).format(DateFormat),
      sleep: c.sleep,
      nutrition: c.nutrition,
      preWorkout: c.preWorkout,
      stress: c.stress,
      burnout: c.burnoutScore,
    }));

  const hasBurnout = checkups.some((c) => c.burnoutScore !== null);

  return (
    <div className="mb-4">
      <h6>Чекапы</h6>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="key" tick={<CustomizedAxisTick />} height={80} />
          <YAxis
            domain={[0, 5]}
            tickCount={6}
            height={300}
            orientation="right"
            tickMargin={0}
            width={28}
            fontSize={12}
          />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="sleep"
            stroke="#8884d8"
            name="Сон"
          />
          <Line
            type="monotone"
            dataKey="nutrition"
            stroke="#82ca9d"
            name="Питание"
          />
          <Line
            type="monotone"
            dataKey="preWorkout"
            stroke="#ffc658"
            name="Предтреник"
          />
          <Line
            type="monotone"
            dataKey="stress"
            stroke="#ff7c7c"
            name="Стресс"
          />
          {hasBurnout && (
            <Line
              type="monotone"
              dataKey="burnout"
              stroke="#d84a4a"
              name="Выгорание"
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
