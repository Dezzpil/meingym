import Link from "next/link";
import { ItemPageParams } from "@/tools/types";
import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import { Purpose } from "@prisma/client";
import { ActionHistoryDataTable } from "@/app/actions/[id]/history/components/ActionHistoryDataTable";

export type ActionHistoryData = {
  completedAt: Date;
  purpose: Purpose;
  liftedCountTotal: number;
  liftedMean: number;
  liftedSum: number;
};

export default async function ActionHistoryPage({ params }: ItemPageParams) {
  const userId = await getCurrentUserId();

  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
  });

  const data = await prisma.$queryRaw<ActionHistoryData[]>`
      SELECT te."completedAt", te."purpose", te."liftedCountTotal", te."liftedMean", te."liftedSum"
      FROM "TrainingExercise" te
               LEFT JOIN "Training" t on t.id = te."trainingId"
      WHERE te."actionId" = ${id} AND te."completedAt" IS NOT NULL AND te."isPassed" IS false AND t."userId" = ${userId}
      ORDER BY te."id" DESC
      LIMIT 100;
  `;

  const dataByPurpose: Record<Purpose, ActionHistoryData[]> = {
    LOSS: [],
    MASS: [],
    STRENGTH: [],
  };
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    dataByPurpose[item.purpose].push(item);
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
          {dataByPurpose[Purpose.MASS].length ? (
            <ActionHistoryDataTable items={dataByPurpose[Purpose.MASS]} />
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>

        <div className="mb-5">
          <h5>На силу</h5>
          {dataByPurpose[Purpose.STRENGTH].length ? (
            <ActionHistoryDataTable items={dataByPurpose[Purpose.STRENGTH]} />
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>

        <div className="mb-5">
          <h5>На снижение веса</h5>
          {dataByPurpose[Purpose.LOSS].length ? (
            <ActionHistoryDataTable items={dataByPurpose[Purpose.LOSS]} />
          ) : (
            <p className="text-muted">Нет данных</p>
          )}
        </div>
      </div>
    </>
  );
}
