import { PersonalRecordType } from "@prisma/client";
import type { PersonalRecord, Purpose } from "@prisma/client";
import { FaTrophy } from "react-icons/fa";
import { GiWeight } from "react-icons/gi";

export type RecordValueLike = Pick<PersonalRecord, "type" | "value" | "reps">;

export type RecordLike = RecordValueLike &
  Pick<PersonalRecord, "previousValue">;

// База — первый результат в истории или в периоде; на UI не показывается
export function isShownRecord(
  record: Pick<PersonalRecord, "previousValue">,
): boolean {
  return record.previousValue !== null;
}

export function recordTypeTitle(type: PersonalRecordType): string {
  return type === PersonalRecordType.MAX_WEIGHT ? "Вес MAX" : "Тоннаж";
}

export function purposeShortTitle(purpose: Purpose): string {
  return { STRENGTH: "сила", MASS: "масса", LOSS: "похудение" }[purpose];
}

export function recordIcon(type: PersonalRecordType) {
  return (
    <>
      {type === PersonalRecordType.MAX_WEIGHT ? (
        <FaTrophy className="text-warning" />
      ) : (
        <GiWeight className="text-warning" />
      )}
    </>
  );
}

// Число с пробелом-разделителем тысяч и точкой в дробной части
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const [intPart, fracPart] = rounded.toString().split(".");
  const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fracPart ? `${spaced}.${fracPart}` : spaced;
}

// «100 кг × 5» для веса, «2 450 кг» для тоннажа
export function formatRecordValue(record: RecordValueLike): string {
  if (record.type === PersonalRecordType.MAX_WEIGHT) {
    return record.reps !== null
      ? `${formatNumber(record.value)} кг × ${record.reps}`
      : `${formatNumber(record.value)} кг`;
  }
  return `${formatNumber(record.value)} кг`;
}

export function formatRecordDelta(record: RecordLike): string {
  const delta = record.value - (record.previousValue ?? 0);
  return `+${formatNumber(delta)} кг`;
}
