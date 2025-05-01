"use client";

import moment from "moment";
import { DateFormat } from "@/tools/dates";
import type { Purpose } from "@prisma/client";
import { TrainingHistoryScore } from "@/app/actions/[id]/history/components/ActionHistoryScores";
import { ScoreCoefficients } from "@/core/scores";
import { Card } from "react-bootstrap";
import Link from "next/link";

type Props = {
  scores: TrainingHistoryScore[];
  purpose: Purpose;
};

function metricLiElement(
  metric: string,
  metricValue: number,
  metricNorm: number,
  coeff: number,
) {
  return (
    <>
      {metricNorm.toFixed(2) !== "0.00" && (
        <li className="d-inline-flex gap-1 align-items-center list-inline-item">
          <b>{metric}:</b>
          <span>{metricValue.toFixed(2)}</span>
          <span>&rarr;</span>
          <abbr
            className="text-muted"
            title={`${metricNorm.toFixed(2)} * ${coeff}`}
          >
            {(metricNorm * coeff).toFixed(2)}
          </abbr>
          <span>&nbsp;</span>
        </li>
      )}
    </>
  );
}

export function ActionHistoryDataItems({ scores, purpose }: Props) {
  return (
    <div>
      {scores.map((i) => (
        <Card key={i.id}>
          <Card.Body
            className={
              "d-inline-flex column-gap-5 align-content-center flex-wrap flex-sm-row"
            }
          >
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <Link href={`/trainings/${i.Exercise.trainingId}`}>
                  {moment(i.createdAt).format(`${DateFormat}`)}
                </Link>
                <span>&nbsp;</span>
                <span>оценка</span>
                <span>:</span>
              </li>
              <li className="list-inline-item">
                <b className={"text-success"}>{i.score.toPrecision(3)}</b>
              </li>
            </ul>
            <ul className="list-inline mb-0">
              {metricLiElement(
                "Σ кг",
                i.Exercise.liftedSum,
                i.liftedSumNorm,
                (i.coefficients as any).liftedSumNorm,
              )}
              {metricLiElement(
                "÷ кг",
                i.Exercise.liftedMean,
                i.liftedMeanNorm,
                (i.coefficients as any).liftedMeanNorm,
              )}
              {metricLiElement(
                "MAX кг",
                i.Exercise.liftedMax,
                i.liftedMaxNorm,
                (i.coefficients as any).liftedMaxNorm,
              )}
              {metricLiElement(
                "Σ раз",
                i.Exercise.liftedCountTotal,
                i.liftedCountTotalNorm,
                (i.coefficients as any).liftedCountTotalNorm,
              )}
              {metricLiElement(
                "÷ раз",
                i.Exercise.liftedCountMean,
                i.liftedCountMeanNorm,
                (i.coefficients as any).liftedCountMeanNorm,
              )}
            </ul>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
