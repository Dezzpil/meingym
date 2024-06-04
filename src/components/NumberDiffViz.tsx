import classNames from "classnames";

type Props = {
  prev: number;
  current: number;
  toFixed?: boolean;
  tooltip?: boolean;
};
export function NumberDiffViz({
  prev,
  current,
  toFixed = true,
  tooltip = true,
}: Props) {
  return prev === current ? (
    <span>{toFixed ? current.toFixed(1) : current}</span>
  ) : tooltip ? (
    <abbr
      title={toFixed ? (current - prev).toFixed(1) : current - prev + ""}
      className={classNames({
        "text-success": current > prev,
        "text-warning": prev > current,
      })}
    >
      {toFixed ? current.toFixed(1) : current}
    </abbr>
  ) : (
    <span
      className={classNames({
        "text-success": current > prev,
        "text-warning": prev > current,
      })}
    >
      {toFixed ? current.toFixed(1) : current}
    </span>
  );
}
