"use client";
import { ActionHistoryData } from "@/app/actions/[id]/history/page";
import { DateFormat } from "@/tools/dates";
import moment from "moment";
import type { Purpose } from "@prisma/client";
import { Scores } from "@/core/progression/scores";

type Props = {
  items: ActionHistoryData[];
  purpose: Purpose;
};
export function ActionHistoryDataTable({ items, purpose }: Props) {
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
              <span>Σ раз</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{Scores[purpose].liftedCountTotalNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>÷ кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{Scores[purpose].liftedMeanNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>Σ кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{Scores[purpose].liftedSumNorm}
              </small>
            </div>
          </th>
          <th>
            <div className="d-flex column-gap-2 align-items-center">
              <span>MAX кг</span>
              <small className="text-muted" title="Коэф. при расчете Оценки">
                *{Scores[purpose].maxWeightNorm}
              </small>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.completedAt.toString()}>
            <td>{moment(i.completedAt).format(`${DateFormat}`)}</td>
            <td>
              {i.extended ? (
                <b className={i.extended.scoreUp ? "text-success" : ""}>
                  {i.extended.score.toPrecision(3)}
                </b>
              ) : (
                <span>&mdash;</span>
              )}
            </td>
            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.liftedCountTotal.toFixed(2)}</span>
                {i.extended && (
                  <span className="text-muted">
                    {i.extended.liftedCountTotalNorm.toFixed(2)}
                  </span>
                )}
              </div>
            </td>

            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.liftedMean.toFixed(2)}</span>
                {i.extended && (
                  <span className="text-muted">
                    {i.extended.liftedMeanNorm.toFixed(2)}
                  </span>
                )}
              </div>
            </td>

            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.liftedSum.toFixed(2)}</span>
                {i.extended && (
                  <span className="text-muted">
                    {i.extended.liftedSumNorm.toFixed(2)}
                  </span>
                )}
              </div>
            </td>

            <td>
              <div className={"d-flex column-gap-2"}>
                <span>{i.maxWeight.toFixed(2)}</span>
                {i.extended && (
                  <span className="text-muted">
                    {i.extended.maxWeightNorm.toFixed(2)}
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
