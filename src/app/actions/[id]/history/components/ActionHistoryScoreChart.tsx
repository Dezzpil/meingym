"use client";

import moment from "moment";
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
import { DateFormat } from "@/tools/dates";
import { TrainingHistoryScore } from "@/app/actions/[id]/history/components/ActionHistoryScores";

type Props = { scores: TrainingHistoryScore[] };
export function ActionHistoryScoreChart({ scores }: Props) {
  const data: Array<{
    key: string;
    liftedMean: number | string;
    liftedCountTotal: number | string;
    liftedSumNorm: number | string;
    maxWeight: number | string;
    score: number | string;
  }> = [];
  scores.forEach((w) => {
    data.unshift({
      key: moment(w.createdAt).format(DateFormat),
      liftedMean: w.liftedMeanNorm.toPrecision(3),
      liftedCountTotal: w.liftedCountTotalNorm.toPrecision(3),
      liftedSumNorm: w.liftedSumNorm.toPrecision(3),
      maxWeight: w.liftedMaxNorm.toPrecision(3),
      score: w.score.toPrecision(3),
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
          stroke="#198754"
          name="Оценка"
          strokeWidth={3}
          dot={true}
        />
        {/*<Line*/}
        {/*  type="monotone"*/}
        {/*  dataKey="liftedCountTotal"*/}
        {/*  stroke="#00F5FF"*/}
        {/*  name="Σ раз"*/}
        {/*/>*/}
        {/*<Line*/}
        {/*  type="monotone"*/}
        {/*  dataKey="liftedMean"*/}
        {/*  stroke="#00CCDD"*/}
        {/*  name="÷ кг"*/}
        {/*/>*/}
        {/*<Line*/}
        {/*  type="monotone"*/}
        {/*  dataKey="liftedSumNorm"*/}
        {/*  stroke="#00CCDD"*/}
        {/*  name="Σ кг"*/}
        {/*/>*/}

        {/*<Line*/}
        {/*  type="monotone"*/}
        {/*  dataKey="maxWeight"*/}
        {/*  stroke="#6439FF"*/}
        {/*  name="MAX кг"*/}
        {/*/>*/}

        <Tooltip />
        <Legend />
        <XAxis dataKey="key" tick={<CustomizedAxisTick />} height={90} />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  );
}
