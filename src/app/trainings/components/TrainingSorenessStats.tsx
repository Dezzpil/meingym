"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { SorenessIntensity } from "@prisma/client";

export type SorenessStat = {
  muscleId: number;
  muscleTitle: string;
  groupTitle: string;
  intensity: SorenessIntensity;
};

const INTENSITY_LABELS: Record<SorenessIntensity, string> = {
  [SorenessIntensity.NONE]: "Нет",
  [SorenessIntensity.LIGHT]: "Лёгкая",
  [SorenessIntensity.MODERATE]: "Умеренная",
  [SorenessIntensity.SEVERE]: "Сильная",
};

const INTENSITY_COLORS: Record<SorenessIntensity, string> = {
  [SorenessIntensity.NONE]: "bg-secondary",
  [SorenessIntensity.LIGHT]: "bg-info",
  [SorenessIntensity.MODERATE]: "bg-warning",
  [SorenessIntensity.SEVERE]: "bg-danger",
};

type Props = {
  stats: SorenessStat[];
  className?: string;
};

export function TrainingSorenessStats({ stats, className }: Props) {
  const [show, setShow] = useState(false);

  if (stats.length === 0) return null;

  const grouped = new Map<string, SorenessStat[]>();
  for (const s of stats) {
    const list = grouped.get(s.groupTitle) ?? [];
    list.push(s);
    grouped.set(s.groupTitle, list);
  }

  const soreCount = stats.filter((s) => s.intensity !== SorenessIntensity.NONE).length;

  return (
    <div className={classNames("p-3", className)}>
      <div className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">
          Крепатура: {soreCount} из {stats.length} мышц
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShow(!show)}
        >
          {show ? "Скрыть" : "Показать"}
        </button>
      </div>
      {show && (
        <ul className="list-inline mt-2 mb-0">
          {Array.from(grouped.entries()).map(([groupTitle, muscles]) =>
            muscles.map((s) => (
              <li key={s.muscleId} className="list-inline-item me-3 mb-1">
                <span className="fw-bold small">{s.groupTitle}:</span>{" "}
                <span className="small">{s.muscleTitle}</span>{" "}
                <span
                  className={classNames(
                    "badge",
                    INTENSITY_COLORS[s.intensity],
                  )}
                >
                  {INTENSITY_LABELS[s.intensity]}
                </span>
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
}
