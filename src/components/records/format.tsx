import { PersonalRecordType } from "@prisma/client";
import type { PersonalRecord, Purpose } from "@prisma/client";
import { FaTrophy } from "react-icons/fa";
import { GiWeight } from "react-icons/gi";

export type RecordValueLike = Pick<PersonalRecord, "type" | "value" | "reps">;

export type RecordLike = RecordValueLike &
  Pick<PersonalRecord, "previousValue">;

// База — первый результат в истории или в периоде; на UI не показывается
export function isShownRecord(
  record: Pick<PersonalRecord, "previousValue" | "isAllTime">,
): boolean {
  return record.isAllTime ? true : record.previousValue !== null;
}

export function recordTypeTitle(
  type: PersonalRecordType,
  isDurationBased = false,
): string {
  // для упражнений «на длительность» формируется только суммарное время (Σ)
  if (isDurationBased) return "Σ";
  return type === PersonalRecordType.MAX_WEIGHT ? "MAX" : "Σ";
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

// «100 кг × 5» для веса, «2 450 кг» для тоннажа, «300 с» для длительности
export function formatRecordValue(
  record: RecordValueLike,
  isDurationBased = false,
): string {
  if (isDurationBased) {
    return `${formatNumber(record.value)} с`;
  }
  if (record.type === PersonalRecordType.MAX_WEIGHT) {
    return record.reps !== null
      ? `${formatNumber(record.value)} кг × ${record.reps}`
      : `${formatNumber(record.value)} кг`;
  }
  return `${formatNumber(record.value)} кг`;
}

export function formatRecordDelta(
  record: RecordLike,
  isDurationBased = false,
): string {
  const delta = record.value - (record.previousValue ?? 0);
  return `+${formatNumber(delta)} ${isDurationBased ? "с" : "кг"}`;
}
