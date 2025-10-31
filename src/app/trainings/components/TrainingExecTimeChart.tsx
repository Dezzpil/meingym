"use client";

import React, { useMemo, useState, MouseEvent } from "react";
import { Bar, BarChart, ResponsiveContainer, YAxis, Cell } from "recharts";

export type ExecTimeItem = {
  seconds: number;
  exercise: string;
  set: number; // номер подхода в упражнении
};

type Props = {
  items: ExecTimeItem[];
  className?: string;
  height?: number;
};

function formatSeconds(sec: number): string {
  if (!sec || sec <= 0) return "0с";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m} м ${s} с` : `${s} с`;
}

export function TrainingExecTimeChart({
  items,
  className,
  height = 220,
}: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const data = useMemo(() => {
    return items.map((it, i) => ({ ...it, idx: i }));
  }, [items]);

  const maxY = useMemo(
    () => Math.max(0, ...items.map((i) => i.seconds)),
    [items],
  );

  if (!items || items.length === 0) return null;

  const onBarClick = (e: MouseEvent<SVGRectElement>, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
    // Save mouse position relative to viewport for simple popover placement
    setPopoverPos({ x: (e as any).clientX ?? 0, y: (e as any).clientY ?? 0 });
  };

  return (
    <div className={className}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
          >
            {/* Только ось Y для масштаба времени */}
            <YAxis
              type="number"
              domain={[0, maxY]}
              tickFormatter={formatSeconds}
              width={40}
            />
            <Bar dataKey="seconds" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={activeIndex === index ? "#0d6efd" : "#6c757d"}
                  onClick={(e) => onBarClick(e, index)}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {activeIndex !== null && popoverPos && (
        <div
          className="position-fixed bg-white border rounded shadow p-2 small"
          style={{
            zIndex: 1080,
            top: Math.max(8, popoverPos.y - 80),
            left: Math.max(8, popoverPos.x - 120),
            maxWidth: 240,
          }}
          onClick={() => setActiveIndex(null)}
        >
          <div className="mb-1 fw-semibold">{data[activeIndex].exercise}</div>
          <div className="mb-1 text-muted">
            Подход №: {data[activeIndex].set}
          </div>
          <div className="mb-0">
            Выполнен за: <b>{formatSeconds(data[activeIndex].seconds)}</b>
          </div>
        </div>
      )}
    </div>
  );
}
