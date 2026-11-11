"use client";

import type { MuscleLoadBreakdown } from "@/core/trainingSummary";
import { LOAD_REST_COLOR, muscleGroupColor } from "@/tools/trainingPalette";

type Props = {
  breakdown: MuscleLoadBreakdown;
};

// SVG, а не набор div'ов: ширина сегмента — это данные, а не оформление,
// и в атрибутах она не требует инлайновых стилей.
export function MuscleLoadBar({ breakdown }: Props) {
  const { segments, restShare } = breakdown;
  if (!segments.length) return null;

  const gap = segments.length > 1 ? 0.7 : 0;
  let x = 0;
  const rects = segments.map((s) => {
    const rect = { key: s.title, x, width: Math.max(s.share - gap, 0.4), fill: muscleGroupColor(s.title) };
    x += s.share;
    return rect;
  });

  if (restShare > 0) {
    rects.push({
      key: "__rest",
      x,
      width: Math.max(restShare - gap, 0.4),
      fill: LOAD_REST_COLOR,
    });
  }

  return (
    <svg
      className="muscle-load-bar"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      role="img"
      aria-label="Распределение нагрузки по группам мышц"
    >
      <g className="muscle-load-bar-fill">
        {rects.map((r) => (
          <rect key={r.key} x={r.x} y={0} width={r.width} height={10} fill={r.fill} />
        ))}
      </g>
    </svg>
  );
}