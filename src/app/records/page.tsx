import Link from "next/link";
import moment from "moment";
import { z } from "zod";
import { PersonalRecordType } from "@prisma/client";
import type { Purpose } from "@prisma/client";
import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import { DateFormat } from "@/tools/dates";
import { RecordMark } from "@/components/records/RecordMark";
import type { RecordWithAction } from "@/components/records/RecordCard";
import {
  formatRecordDelta,
  formatRecordValue,
  recordTypeTitle,
} from "@/components/records/format";

const typeParamSchema = z.object({
  type: z
    .enum([PersonalRecordType.MAX_WEIGHT, PersonalRecordType.MAX_VOLUME])
    .optional(),
});

const purposeShort: Record<Purpose, string> = {
  STRENGTH: "сила",
  MASS: "масса",
  LOSS: "похудение",
};

type RecordsPageProps = {
  searchParams: { type?: string };
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const userId = await getCurrentUserId();
  const parsed = typeParamSchema.safeParse(searchParams);
  const typeFilter = parsed.success ? parsed.data.type : undefined;
  const typeWhere = typeFilter ? { type: typeFilter } : {};

  const [currentRecords, historyRecords] = await Promise.all([
    // действующие all-time рекорды: последняя запись по каждой связке
    prisma.personalRecord.findMany({
      where: { userId, isAllTime: true, ...typeWhere },
      distinct: ["actionId", "purpose", "type"],
      orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
      include: { Action: { select: { id: true, title: true, alias: true } } },
    }),
    prisma.personalRecord.findMany({
      where: { userId, previousValue: { not: null }, ...typeWhere },
      orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
      take: 100,
      include: { Action: { select: { id: true, title: true, alias: true } } },
    }),
  ]);

  // группировка действующих рекордов по упражнению, порядок групп — по свежести
  const byAction = new Map<
    number,
    { action: RecordWithAction["Action"]; records: RecordWithAction[] }
  >();
  for (const record of currentRecords) {
    const group = byAction.get(record.actionId) ?? {
      action: record.Action,
      records: [],
    };
    group.records.push(record);
    byAction.set(record.actionId, group);
  }

  const filters = [
    {
      title: "Все",
      href: "/records",
      active: typeFilter === undefined,
    },
    {
      title: recordTypeTitle(PersonalRecordType.MAX_WEIGHT),
      href: `/records?type=${PersonalRecordType.MAX_WEIGHT}`,
      active: typeFilter === PersonalRecordType.MAX_WEIGHT,
    },
    {
      title: recordTypeTitle(PersonalRecordType.MAX_VOLUME),
      href: `/records?type=${PersonalRecordType.MAX_VOLUME}`,
      active: typeFilter === PersonalRecordType.MAX_VOLUME,
    },
  ];

  return (
    <>
      <header className="mb-3 d-flex justify-content-between align-items-baseline flex-wrap column-gap-2">
        <h3>Рекорды</h3>
        <nav className="d-flex column-gap-2">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={f.active ? "fw-bold" : ""}
            >
              {f.title}
            </Link>
          ))}
        </nav>
      </header>

      {currentRecords.length === 0 && historyRecords.length === 0 ? (
        <div className="alert alert-light">
          Рекордов пока нет — завершите и обработайте первую тренировку!
        </div>
      ) : (
        <>
          <section className="mb-3">
            {[...byAction.values()].map(({ action, records }) => (
              <div className="card mb-2" key={action.id}>
                <div className="card-body py-2">
                  <div className=" mb-1">{action.alias || action.title}</div>
                  <ul className="list-unstyled mb-0">
                    {records.map((record) => (
                      <li
                        key={record.id}
                        className="mb-1 d-flex align-items-center column-gap-2 flex-wrap"
                      >
                        <RecordMark record={record} withIcon withTitle />
                        <Link
                          href={`/trainings/${record.trainingId}`}
                          className="text-decoration-none"
                        >
                          {formatRecordValue(record)}
                        </Link>
                        <span className="badge text-bg-light">
                          {purposeShort[record.purpose]}
                        </span>
                        <small className="text-muted">
                          {moment(record.achievedAt).format(DateFormat)}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 className="h6 text-muted">История рекордов</h2>
            {historyRecords.map((record) => (
              <div
                key={record.id}
                className={`card mb-2 ${
                  record.isAllTime
                    ? "record-card-alltime"
                    : "record-card-period"
                }`}
              >
                <div className="card-body d-flex align-items-center column-gap-2 flex-wrap py-2">
                  <RecordMark record={record} />
                  <Link
                    href={`/trainings/${record.trainingId}`}
                    className="text-decoration-none"
                  >
                    {record.Action.alias || record.Action.title}
                  </Link>
                  <span className="fw-semibold">
                    {formatRecordValue(record)}
                  </span>
                  <span className="record-delta small">
                    {formatRecordDelta(record)}
                  </span>
                  <small className="text-muted">
                    {moment(record.achievedAt).format(DateFormat)} ·{" "}
                    {recordTypeTitle(record.type)} ·{" "}
                    {record.isAllTime ? "рекорд all-time" : "рекорд периода"}
                  </small>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
