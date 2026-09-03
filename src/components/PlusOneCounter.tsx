"use client";

import React, { useCallback, useRef, useState } from "react";
import classNames from "classnames";
import { FaMinus } from "react-icons/fa6";

type Pop = { id: number; variant: number };

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

// Счетчик с кнопкой «+1»: каждое нажатие поднимает всплывающий «+1» над кнопкой
export default function PlusOneCounter({
  value,
  onChange,
  min = 0,
  max = 8,
}: Props) {
  const [pops, setPops] = useState<Pop[]>([]);
  const nextPopId = useRef(0);

  const addOne = useCallback(() => {
    if (value >= max) {
      return;
    }
    onChange(value + 1);
    const id = nextPopId.current++;
    setPops((prev) => [...prev, { id, variant: id % 4 }]);
  }, [max, onChange, value]);

  const removePop = useCallback((id: number) => {
    setPops((prev) => prev.filter((pop) => pop.id !== id));
  }, []);

  return (
    <div className="plus-one d-flex align-items-center gap-2">
      <button
        type="button"
        className="plus-one-btn plus-one-minus"
        disabled={value <= min}
        aria-label="Убрать одно повторение"
        onClick={() => onChange(value - 1)}
      >
        <FaMinus />
      </button>
      {/* key перемонтирует значение, чтобы проиграть анимацию на каждом изменении */}
      <span key={value} className="plus-one-value" aria-live="polite">
        {value}
      </span>
      <span className="plus-one-plus-wrap">
        {pops.map((pop) => (
          <span
            key={pop.id}
            className={classNames("plus-one-pop", `plus-one-pop-${pop.variant}`)}
            onAnimationEnd={() => removePop(pop.id)}
            aria-hidden="true"
          >
            +1
          </span>
        ))}
        <button
          type="button"
          className="plus-one-btn plus-one-plus"
          disabled={value >= max}
          aria-label="Добавить одно повторение"
          onClick={addOne}
        >
          +1
        </button>
      </span>
    </div>
  );
}
