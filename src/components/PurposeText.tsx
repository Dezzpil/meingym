import { CurrentPurpose } from "@/core/types";
import classNames from "classnames";

type Props = {
  purpose: CurrentPurpose;
  firstUp?: boolean;
  brackets?: boolean;
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
}: Props) {
  return (
    <span
      className={classNames("text-muted", {
        "capitalize-first-letter": firstUp,
      })}
    >
      {brackets && "("}
      {map[purpose]}
      {brackets && ")"}
    </span>
  );
}
