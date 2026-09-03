"use client";

import React from "react";
import classNames from "classnames";

// палитра модального окна: серый, оранжевый, зеленый
export type SegmentedSliderTone = "success" | "warning" | "secondary";

export type SegmentedSliderOption<T extends string> = {
  value: T;
  // короткая подпись на сегменте; без нее сегмент показывает только иконку
  label?: string;
  // доступное имя для сегмента без подписи
  ariaLabel?: string;
  // развернутое описание выбранного значения под ползунком
  hint?: string;
  tone?: SegmentedSliderTone;
  icon?: React.ReactNode;
};

type Props<T extends string> = {
  options: SegmentedSliderOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
};

// Пошаговый ползунок: сегменты с «бегунком», переезжающим на выбранное значение
export default function SegmentedSlider<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: Props<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];
  const hasHints = options.some((option) => option.hint);
  // подсказка уезжает под выбранный сегмент: к левому краю, по центру, к правому
  const hintAlign =
    selectedIndex === 0
      ? "left"
      : selectedIndex === options.length - 1
        ? "right"
        : "center";

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        data-selected={selectedIndex}
        className={classNames(
          "seg-slider",
          `seg-slider-${options.length}`,
          `seg-tone-${selected.tone ?? "primary"}`,
        )}
      >
        <span className="seg-slider-thumb" aria-hidden="true" />
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={index === selectedIndex}
            aria-label={option.ariaLabel ?? option.label}
            className={classNames("seg-slider-option", {
              active: index === selectedIndex,
            })}
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className="seg-slider-icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            {option.label && <span>{option.label}</span>}
          </button>
        ))}
      </div>
      {hasHints && (
        <div className="seg-slider-hint" data-align={hintAlign}>
          <span className="seg-slider-hint-text">{selected.hint}</span>
        </div>
      )}
    </div>
  );
}
