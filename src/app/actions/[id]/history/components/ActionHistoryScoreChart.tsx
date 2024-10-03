"use client";

import { ActionHistoryData } from "@/app/actions/[id]/history/page";
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
import moment from "moment";
import { DateFormat } from "@/tools/dates";

type Props = { items: ActionHistoryData[] };
export function ActionHistoryScoreChart({ items }: Props) {
  const data: Array<{
    key: string;
    maxWeight: number | string;
    // liftedSum: number | string;
    liftedMean: number | string;
    liftedCountTotal: number | string;
    score: number | string;
  }> = [];
  items.forEach((w) => {
    data.unshift({
      key: moment(w.completedAt).format(DateFormat),
      maxWeight: w.extended ? w.extended.maxWeightNorm.toPrecision(3) : 0,
      // liftedSum: w.extended ? w.extended.liftedSumNorm.toPrecision(3) : 0,
      liftedMean: w.extended ? w.extended.liftedMeanNorm.toPrecision(3) : 0,
      liftedCountTotal: w.extended
        ? w.extended.liftedCountTotalNorm.toPrecision(3)
        : 0,
      score: w.extended ? w.extended.score.toPrecision(3) : 0,
    });
  });
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <Line
          type="monotone"
          dataKey="score"
          // stroke="#72BF78"
          stroke="#198754"
          name="Оценка"
          strokeWidth={3}
          dot={true}
        />
        <Line
          type="monotone"
          dataKey="liftedCountTotal"
          stroke="#00F5FF"
          name="Σ раз"
        />
        <Line
          type="monotone"
          dataKey="liftedMean"
          stroke="#00CCDD"
          name="÷ кг"
        />
        {/*<Line*/}
        {/*  type="monotone"*/}
        {/*  dataKey="liftedSum"*/}
        {/*  stroke="#4F75FF"*/}
        {/*  name="Σ кг"*/}
        {/*/>*/}

        <Line type="monotone" dataKey="max" stroke="#6439FF" name="MAX кг" />

        <Tooltip />
        <Legend />
        <XAxis dataKey="key" tick={<CustomizedAxisTick />} height={90} />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  );
}
