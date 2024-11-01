import Link from "next/link";
import { ItemPageParams } from "@/tools/types";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import { Purpose } from "@prisma/client";
import { ActionHistoryDataTable } from "@/app/actions/[id]/history/components/ActionHistoryDataTable";
import { convert, normLog, normMinMax } from "@/core/convert";
import { DataRows, score } from "@/core/progression/scores";
import { ActionHistoryScoreChart } from "@/app/actions/[id]/history/components/ActionHistoryScoreChart";

export type ActionHistoryData = {
  id: number;
  completedAt: Date;
  purpose: Purpose;
  liftedCountTotal: number;
  liftedMean: number;
  liftedSum: number;
  maxWeight: number;
  extended?: Record<keyof DataRows, number> & {
    score: number;
    scoreUp: boolean;
  };
};

const processData = (
  items: Record<Purpose, ActionHistoryData[]>,
  fn: CallableFunction,
): Record<Purpose, DataRows> => {
  // const minWeight = 3;
  // const minCount = 10;
  // const maxWeight = 200;
  // const maxCount = 20;
  // @ts-ignore
  const result: Record<Purpose, DataRows> = {};
  for (const key of Object.keys(items)) {
    const purpose = key as Purpose;
    const converted = convert<ActionHistoryData>(items[purpose], [
      "maxWeight",
      "liftedSum",
      "liftedMean",
      "liftedCountTotal",
    ]);
    result[purpose] = {
      maxWeightNorm: fn(converted.maxWeight, 5, 200),
      liftedSumNorm: fn(converted.liftedSum, 100, 5000),
      liftedMeanNorm: fn(converted.liftedMean, 20, 100),
      liftedCountTotalNorm: fn(converted.liftedCountTotal, 12, 100),
    };
  }
  return result;
};

export default async function ActionHistoryPage({ params }: ItemPageParams) {
  const userId = await getCurrentUserId();

  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
  });

  const data = await prisma.$queryRaw<ActionHistoryData[]>`
      SELECT
          te.id,
          te."completedAt",
          te."purpose",
          te."liftedCountTotal",
          te."liftedMean",
          te."liftedSum",
          MAX(exec."liftedWeight") as "maxWeight"
      FROM "TrainingExercise" te
        LEFT JOIN "Training" t on t.id = te."trainingId"
        LEFT JOIN "TrainingExerciseExecution" exec on te.id = exec."exerciseId"
      WHERE
        te."actionId" = ${id} AND te."completedAt" IS NOT NULL AND te."isPassed" IS false
        AND t."userId" = ${userId}
        AND exec."executedAt" IS NOT NULL AND exec."isPassed" IS FALSE
      GROUP BY te.id
      ORDER BY te."id" DESC
      LIMIT 100;
  `;

  const itemsByPurpose: Record<Purpose, ActionHistoryData[]> = {
    LOSS: [],
    MASS: [],
    STRENGTH: [],
  };
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    itemsByPurpose[item.purpose].push(item);
  }
  const result = processData(itemsByPurpose, normMinMax);
  const scores = score(result, data.length);

  for (const [purpose, items] of Object.entries(itemsByPurpose)) {
    const key = purpose as Purpose;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.extended = {
        liftedCountTotalNorm: result[key].liftedCountTotalNorm[i],
        maxWeightNorm: result[key].maxWeightNorm[i],
        liftedSumNorm: result[key].liftedSumNorm[i],
        liftedMeanNorm: result[key].liftedMeanNorm[i],
        score: scores[key][i],
        scoreUp: i < items.length - 1 && scores[key][i] > scores[key][i + 1],
      };
    }
  }

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <Link href={`/actions/${id}`} className="nav-link">
            Редактирование
          </Link>
        </li>
        <li className="nav-item">
          <Link href={`/actions/${id}/state`} className="nav-link">
            Подходы
          </Link>
        </li>
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">
            История
          </a>
        </li>
      </ul>
      <div className="mb-3">
        <div className="mb-5">
          <h5>На массу</h5>
          {itemsByPurpose[Purpose.MASS].length ? (
            <>
              <ActionHistoryScoreChart items={itemsByPurpose[Purpose.MASS]} />
              <ActionHistoryDataTable
                items={itemsByPurpose[Purpose.MASS]}
                purpose={Purpose.MASS}
              />
            </>
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>

        <div className="mb-5">
          <h5>На силу</h5>
          {itemsByPurpose[Purpose.STRENGTH].length ? (
            <>
              <ActionHistoryScoreChart
                items={itemsByPurpose[Purpose.STRENGTH]}
              />
              <ActionHistoryDataTable
                items={itemsByPurpose[Purpose.STRENGTH]}
                purpose={Purpose.STRENGTH}
              />
            </>
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>

        <div className="mb-5">
          <h5>На снижение веса</h5>
          {itemsByPurpose[Purpose.LOSS].length ? (
            <>
              <ActionHistoryScoreChart items={itemsByPurpose[Purpose.LOSS]} />
              <ActionHistoryDataTable
                items={itemsByPurpose[Purpose.LOSS]}
                purpose={Purpose.LOSS}
              />
            </>
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>
      </div>
    </>
  );
}
