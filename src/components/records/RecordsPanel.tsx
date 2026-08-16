import Link from "next/link";
import moment from "moment";
import { DateFormat } from "@/tools/dates";
import { RecordCard } from "./RecordCard";
import type { RecordWithAction } from "./RecordCard";
import { RecordMark } from "./RecordMark";
import { formatRecordDelta, formatRecordValue, isShownRecord } from "./format";

type Props = {
  records: RecordWithAction[];
};

// Блок «Рекорды» на главной: all-time рекорды последних тренировок
// плюс объединённый спокойный блок рекордов периода
export function RecordsPanel({ records }: Props) {
  const shown = records.filter(isShownRecord);
  if (!shown.length) return null;

  const allTimeRecords = shown.filter((r) => r.isAllTime);
  const periodRecords = shown.filter((r) => !r.isAllTime);

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-end align-items-baseline mb-2">
        <Link href="/records">Все рекорды</Link>
      </div>
      {allTimeRecords.length > 0 && (
        <div className="d-flex gap-3 flex-wrap flex-column mb-3">
          {allTimeRecords.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
      {periodRecords.length > 0 && (
        <div className="card">
          <div className="card-header">Лучшие результаты за период</div>
          <ul className="list-group list-group-flush">
            {periodRecords.map((record) => (
              <li key={record.id} className="list-group-item">
                <Link
                  href={`/trainings/${record.trainingId}`}
                  className="text-decoration-none"
                >
                  <div className="mb-2">
                    {record.Action.alias || record.Action.title}:{" "}
                    {formatRecordValue(record)}
                  </div>
                  <div className="d-flex justify-content-between align-items-baseline">
                    <div className="d-inline-flex column-gap-3 align-items-baseline">
                      <span className="record-delta">
                        {formatRecordDelta(record)}
                      </span>
                      <span className="text-muted">
                        {moment(record.achievedAt).format(DateFormat)}
                      </span>
                    </div>
                    <RecordMark record={record} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
