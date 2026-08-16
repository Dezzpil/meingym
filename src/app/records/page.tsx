import Link from "next/link";
import moment from "moment";
import { z } from "zod";
import classNames from "classnames";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { PersonalRecordType, Purpose } from "@prisma/client";
import { prisma } from "@/tools/db";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { DateFormat } from "@/tools/dates";
import { RecordMark } from "@/components/records/RecordMark";
import type { RecordWithAction } from "@/components/records/RecordCard";
import {
  formatRecordDelta,
  formatRecordValue,
  purposeShortTitle,
  recordTypeTitle,
} from "@/components/records/format";

const TABS = {
  history: "История",
  current: "Действующие",
} as const;
type Tab = keyof typeof TABS;

const TYPE_VALUES = [
  PersonalRecordType.MAX_WEIGHT,
  PersonalRecordType.MAX_VOLUME,
] as const;
const PURPOSE_VALUES = [Purpose.MASS, Purpose.STRENGTH, Purpose.LOSS];

const PURPOSE_TITLES: Record<Purpose, string> = {
  MASS: "Масса",
  STRENGTH: "Сила",
  LOSS: "Похудение",
};

const searchParamsSchema = z.object({
  tab: z.enum(["history", "current"]).optional(),
  type: z.string().optional(),
  purpose: z.string().optional(),
});

// undefined → дефолт; пустое значение → осознанно ничего не выбрано
function parseCsv<T extends string>(
  raw: string | undefined,
  valid: readonly T[],
): T[] | null {
  if (raw === undefined) return null;
  return raw
    .split(",")
    .filter((v) => (valid as readonly string[]).includes(v)) as T[];
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function buildUrl(
  tab: Tab,
  types: PersonalRecordType[],
  purposes: Purpose[],
): string {
  const sp = new URLSearchParams();
  sp.set("tab", tab);
  sp.set("type", types.join(","));
  sp.set("purpose", purposes.join(","));
  return `/records?${sp.toString()}`;
}

function FilterToggle({
  href,
  checked,
  title,
}: {
  href: string;
  checked: boolean;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="text-decoration-none d-inline-flex align-items-center column-gap-1"
    >
      {checked ? (
        <FaCheckSquare className="text-primary" />
      ) : (
        <FaRegSquare className="text-secondary" />
      )}
      <span className={checked ? "" : "text-muted"}>{title}</span>
    </Link>
  );
}

type RecordsPageProps = {
  searchParams: { tab?: string; type?: string; purpose?: string };
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const userId = await getCurrentUserId();
  const userInfo = await findUserInfo(userId);

  const parsed = searchParamsSchema.safeParse(searchParams);
  const raw = parsed.success ? parsed.data : {};
  const tab: Tab = raw.tab === "current" ? "current" : "history";
  // по умолчанию: тип — вес, цель — выбранная у пользователя в профиле
  const selectedTypes = parseCsv(raw.type, TYPE_VALUES) ?? [
    PersonalRecordType.MAX_WEIGHT,
  ];
  const selectedPurposes = parseCsv(raw.purpose, PURPOSE_VALUES) ?? [
    userInfo.purpose,
  ];

  const filtersWhere = {
    type: { in: selectedTypes },
    purpose: { in: selectedPurposes },
  };

  const historyRecords: RecordWithAction[] =
    tab === "history"
      ? await prisma.personalRecord.findMany({
          where: { userId, previousValue: { not: null }, ...filtersWhere },
          orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
          take: 100,
          include: {
            Action: { select: { id: true, title: true, alias: true } },
          },
        })
      : [];

  // действующие all-time рекорды: последняя запись по каждой связке
  const currentRecords: RecordWithAction[] =
    tab === "current"
      ? await prisma.personalRecord.findMany({
          where: { userId, isAllTime: true, ...filtersWhere },
          distinct: ["actionId", "purpose", "type"],
          orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
          include: {
            Action: { select: { id: true, title: true, alias: true } },
          },
        })
      : [];

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

  const hasRecords = historyRecords.length > 0 || currentRecords.length > 0;

  return (
    <>
      <header className="mb-3">
        <h3>Рекорды</h3>
      </header>

      <ul className="nav nav-tabs mb-3">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <li className="nav-item" key={key}>
            {tab === key ? (
              <a
                className="nav-link active rounded-top"
                aria-current="page"
                href="#"
              >
                {TABS[key]}
              </a>
            ) : (
              <Link
                className="nav-link text-secondary rounded-top"
                href={buildUrl(key, selectedTypes, selectedPurposes)}
              >
                {TABS[key]}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="mb-3 d-flex flex-wrap column-gap-4">
        <div className="d-flex align-items-center column-gap-2">
          <span className="text-muted small text-uppercase">Тип</span>
          {TYPE_VALUES.map((type) => (
            <FilterToggle
              key={type}
              checked={selectedTypes.includes(type)}
              title={recordTypeTitle(type)}
              href={buildUrl(
                tab,
                toggleValue(selectedTypes, type),
                selectedPurposes,
              )}
            />
          ))}
        </div>
        <div className="d-flex align-items-center column-gap-2 flex-wrap">
          <span className="text-muted small text-uppercase">Цель</span>
          {PURPOSE_VALUES.map((purpose) => (
            <FilterToggle
              key={purpose}
              checked={selectedPurposes.includes(purpose)}
              title={PURPOSE_TITLES[purpose]}
              href={buildUrl(
                tab,
                selectedTypes,
                toggleValue(selectedPurposes, purpose),
              )}
            />
          ))}
        </div>
      </div>

      {!hasRecords && (
        <div className="alert alert-light">
          Рекордов пока нет — завершите и обработайте первую тренировку!
        </div>
      )}

      {tab === "history" && historyRecords.length > 0 && (
        <section>
          {historyRecords.map((record) => (
            <div
              key={record.id}
              className={classNames(
                "card mb-2",
                record.isAllTime ? "record-card-alltime" : "record-card-period",
              )}
            >
              <div className="card-body d-flex align-items-center column-gap-2 flex-wrap py-2">
                <RecordMark record={record} withIcon />
                <Link
                  href={`/actions/${record.actionId}`}
                  className="text-decoration-none"
                >
                  {record.Action.alias || record.Action.title}
                </Link>
                <Link
                  href={`/trainings/${record.trainingId}`}
                  className="text-decoration-none fw-semibold"
                >
                  {formatRecordValue(record)}
                </Link>
                <span className="record-delta small">
                  {formatRecordDelta(record)}
                </span>
                <small className="text-muted">
                  {moment(record.achievedAt).format(DateFormat)} ·{" "}
                  {record.isAllTime ? "рекорд all-time" : "рекорд периода"}
                </small>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "current" && currentRecords.length > 0 && (
        <section>
          {[...byAction.values()].map(({ action, records }) => (
            <div className="card mb-2" key={action.id}>
              <div className="card-body py-2">
                <div className="mb-1">
                  <Link
                    href={`/actions/${action.id}`}
                    className="text-decoration-none"
                  >
                    {action.alias || action.title}
                  </Link>
                </div>
                <ul className="list-unstyled mb-0">
                  {records.map((record) => (
                    <li
                      key={record.id}
                      className="mb-1 d-flex align-items-center column-gap-2 flex-wrap"
                    >
                      <RecordMark record={record} withIcon />
                      <Link
                        href={`/trainings/${record.trainingId}`}
                        className="text-decoration-none"
                      >
                        {formatRecordValue(record)}
                      </Link>
                      <span className="badge text-bg-light">
                        {purposeShortTitle(record.purpose)}
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
      )}
    </>
  );
}
