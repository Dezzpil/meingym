import classNames from "classnames";
import moment from "moment";
import { useMemo } from "react";

const map = {
  Monday: "понедельник",
  Tuesday: "вторник",
  Wednesday: "среда",
  Thursday: "четверг",
  Friday: "пятница",
  Saturday: "суббота",
  Sunday: "воскресенье",
};

type mapKey = keyof typeof map;

type Props = {
  date: Date;
  firstUp?: boolean;
  brackets?: boolean;
};

export function NameOfTheDay({
  date,
  firstUp = false,
  brackets = true,
}: Props) {
  const day = useMemo(() => {
    return moment(date).format("dddd");
  }, [date]);
  return (
    <span
      className={classNames("text-muted", {
        "capitalize-first-letter": firstUp,
      })}
    >
      {brackets && "("}
      {map[day as mapKey]}
      {brackets && ")"}
    </span>
  );
}
