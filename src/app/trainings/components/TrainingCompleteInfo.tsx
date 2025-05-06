import { Training } from "@prisma/client";
import moment from "moment";
import { TimeFormat } from "@/tools/dates";
import { FaLongArrowAltRight } from "react-icons/fa";
import React from "react";
import Link from "next/link";

type Props = {
  training: Training;
};
export function TrainingCompleteInfo({ training }: Props) {
  return (
    <div className="d-flex justify-content-between">
      <div className={"d-flex gap-2 align-items-center"}>
        <span>{moment(training.startedAt).format(TimeFormat)}</span>
        <FaLongArrowAltRight />
        <span>{moment(training.completedAt).format(TimeFormat)}</span>
        <span>
          (+
          {moment(training.completedAt).diff(
            moment(training.startedAt),
            "minute",
          )}{" "}
          мин.)
        </span>
      </div>
      <Link href={`/trainings/${training.id}`}>Подробнее</Link>
    </div>
  );
}
