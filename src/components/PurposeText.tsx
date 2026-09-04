import { CurrentPurpose } from "@/core/types";
import classNames from "classnames";

type Props = {
  purpose: CurrentPurpose;
  firstUp?: boolean;
  brackets?: boolean;
  isDurationBased?: boolean;
};
const map: Record<CurrentPurpose, string> = {
  STRENGTH: "на развитие силы",
  MASS: "на набор массы",
  LOSS: "на снижение веса",
};
export function PurposeText({
  purpose,
  firstUp = false,
  brackets = true,
  isDurationBased = false,
}: Props) {
  const text = isDurationBased ? "на длительность" : map[purpose];
  return (
    <span
      className={classNames("text-muted", {
        "capitalize-first-letter": firstUp,
      })}
    >
      {brackets && "("}
      {text}
      {brackets && ")"}
    </span>
  );
}
