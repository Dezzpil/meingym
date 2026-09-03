"use client";

import React, { useCallback, useRef, useState } from "react";
import classNames from "classnames";
import type { SegmentedSliderTone } from "@/components/SegmentedSlider";

const SPARKS_PER_BURST = 6;

type Spark = { id: number; variant: number };

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  // без подписи чип показывает только иконку
  label?: string;
  ariaLabel?: string;
  tone?: SegmentedSliderTone;
  // при включении рассыпаются огонечки
  celebrate?: boolean;
};

// Чекбокс-«чип» с иконкой: компактный переключатель да/нет
export default function ToggleChip({
  checked,
  onChange,
  icon,
  label,
  ariaLabel,
  tone = "secondary",
  celebrate = false,
}: Props) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextSparkId = useRef(0);

  const toggle = useCallback(() => {
    const next = !checked;
    onChange(next);
    if (next && celebrate) {
      const firstId = nextSparkId.current;
      nextSparkId.current += SPARKS_PER_BURST;
      setSparks((prev) => [
        ...prev,
        ...Array.from({ length: SPARKS_PER_BURST }, (_, i) => ({
          id: firstId + i,
          variant: i,
        })),
      ]);
    }
  }, [celebrate, checked, onChange]);

  const removeSpark = useCallback((id: number) => {
    setSparks((prev) => prev.filter((spark) => spark.id !== id));
  }, []);

  const name = label ?? ariaLabel;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={name}
      title={label ? undefined : ariaLabel}
      className={classNames("toggle-chip", `toggle-chip-${tone}`, {
        active: checked,
        "toggle-chip-icon-only": !label,
      })}
      onClick={toggle}
    >
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className={classNames(
            "toggle-chip-spark",
            `toggle-chip-spark-${spark.variant}`,
          )}
          onAnimationEnd={() => removeSpark(spark.id)}
          aria-hidden="true"
        />
      ))}
      <span className="toggle-chip-icon" aria-hidden="true">
        {icon}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
