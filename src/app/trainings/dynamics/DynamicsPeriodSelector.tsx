"use client";

import Link from "next/link";

type Props = {
  monthsBack: number;
};

export function DynamicsPeriodSelector({ monthsBack }: Props) {
  return (
    <div className="d-flex gap-2">
      <Link href="/trainings" className="btn btn-outline-secondary btn-sm">
        ← К списку
      </Link>
      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        defaultValue={monthsBack}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("months", e.target.value);
          window.location.href = url.toString();
        }}
      >
        <option value={1}>1 месяц</option>
        <option value={3}>3 месяца</option>
        <option value={6}>6 месяцев</option>
        <option value={12}>12 месяцев</option>
      </select>
    </div>
  );
}
