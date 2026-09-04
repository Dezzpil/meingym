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
  iconFirst?: boolean;
  isDurationBased?: boolean;
};

export function RecordMark({
  record,
  withIcon,
  withTitle,
  iconFirst,
  className,
  isDurationBased,
}: Props) {
  const title = record.isAllTime
    ? `Новый рекорд — ${recordTypeTitle(
        record.type,
        isDurationBased,
      ).toLowerCase()}: ${formatRecordValue(record, isDurationBased)}`
    : `Лучший результат за период — ${recordTypeTitle(
        record.type,
        isDurationBased,
      ).toLowerCase()}: ${formatRecordValue(record, isDurationBased)}`;
  return (
    <div
      className={classNames(
        "d-inline-flex column-gap-1 align-items-center",
        className,
      )}
    >
      {iconFirst && withIcon && recordIcon(record.type)}
      {withTitle && (
        <small className="text-dark" title={title}>
          {recordTypeTitle(record.type, isDurationBased)}
        </small>
      )}
      {!iconFirst && withIcon && recordIcon(record.type)}
    </div>
  );
}
