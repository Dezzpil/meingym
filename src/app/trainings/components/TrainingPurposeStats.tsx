"use client";

import { useMemo } from "react";
import classNames from "classnames";
import { Purpose } from "@prisma/client";
import { computePurposeShares } from "@/core/trainingSummary";

type Props = {
  purposes: Purpose[];
  className?: string;
};

export function TrainingPurposeStats({ purposes, className }: Props) {
  const shares = useMemo(() => computePurposeShares(purposes), [purposes]);

  if (!shares.length) return null;

  return (
    <div className={className}>
      <div className="chip-row mb-0">
        <b>Цели:</b>
        {shares.map(({ purpose, title, share, isMain }) => (
          <span
            key={purpose}
            className={classNames("tag-chip", { "tag-chip-strong": isMain })}
          >
            {title} <b>{share}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}