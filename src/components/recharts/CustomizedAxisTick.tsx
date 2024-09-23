"use client";

// @ts-ignore
export const CustomizedAxisTick = (props) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={10}
        y={10}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
        fontSize={12}
      >
        {payload.value}
      </text>
    </g>
  );
};
