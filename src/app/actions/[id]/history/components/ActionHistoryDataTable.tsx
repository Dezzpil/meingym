"use client";

import moment from "moment";
import { DateFormat } from "@/tools/dates";
import type { Purpose } from "@prisma/client";
import { TrainingHistoryScore } from "@/app/actions/[id]/history/components/ActionHistoryScores";
import { ScoreCoefficients } from "@/core/scores";

type Props = {
  scores: TrainingHistoryScore[];
  purpose: Purpose;
};
export function ActionHistoryDataTable({ scores, purpose }: Props) {
  return (
    <table className="table table-sm table">
      <colgroup>
        <col width="*" />
        <col width="10%" />
        <col width="15%" />
        <col width="15%" />
        <col width="15%" />
        <col width="15%" />
      </colgroup>
      <thead>
        <tr>
          <th>Выполнено</th>
          <th>Оценка</th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>Σ кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{ScoreCoefficients[purpose].liftedSumNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>÷ кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{ScoreCoefficients[purpose].liftedMeanNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>Σ раз</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{ScoreCoefficients[purpose].liftedCountTotalNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>÷ раз</span>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>MAX кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{ScoreCoefficients[purpose].liftedMaxNorm}
              </small>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {scores.map((i) => (
          <tr key={i.createdAt.toString()}>
            <td>{moment(i.createdAt).format(`${DateFormat}`)}</td>
            <td>
              <b className={"text-success"}>{i.score.toPrecision(3)}</b>
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.Exercise.liftedSum.toFixed(2)}</span>
                <span className="text-muted">{i.liftedSumNorm.toFixed(2)}</span>
              </div>
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.Exercise.liftedMean.toFixed(2)}</span>
                <span className="text-muted">
                  {i.liftedMeanNorm.toFixed(2)}
                </span>
              </div>
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.Exercise.liftedCountTotal.toFixed(2)}</span>
                <span className="text-muted">
                  {i.liftedCountTotalNorm.toFixed(2)}
                </span>
              </div>
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.Exercise.liftedCountMean.toFixed(2)}</span>
              </div>
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.Exercise.liftedMax.toFixed(2)}</span>
                <span className="text-muted">{i.liftedMaxNorm.toFixed(2)}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
