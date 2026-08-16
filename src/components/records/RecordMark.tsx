import {
  formatRecordValue,
  recordIcon,
  recordTypeTitle,
} from "@/components/records/format";
import { PersonalRecord } from "@prisma/client";
import classNames from "classnames";

type Props = {
  record: Pick<PersonalRecord, "type" | "isAllTime" | "value" | "reps">;
  className?: string;
  withIcon?: boolean;
  withTitle?: boolean;
};

export function RecordMark({ record, withIcon, className }: Props) {
  const title = record.isAllTime
    ? `Новый рекорд — ${recordTypeTitle(
        record.type,
      ).toLowerCase()}: ${formatRecordValue(record)}`
    : `Лучший результат за период — ${recordTypeTitle(
        record.type,
      ).toLowerCase()}: ${formatRecordValue(record)}`;
  return (
    <div
      className={classNames(
        "d-inline-flex column-gap-3 align-items-center",
        className,
      )}
    >
      {withIcon && (
        <span className="badge bg-light text-dark" title={title}>
          {recordTypeTitle(record.type)}
        </span>
      )}
      {withIcon && recordIcon(record.type)}
    </div>
  );
}
