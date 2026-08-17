"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import moment from "moment";
import type { Action, PersonalRecord } from "@prisma/client";
import { DateFormat } from "@/tools/dates";
import {
  formatRecordDelta,
  formatRecordValue,
  recordIcon,
  recordTypeTitle,
} from "./format";
import { PurposeName } from "@/tools/purposes";

export type RecordWithAction = PersonalRecord & {
  Action: Pick<Action, "id" | "title" | "alias">;
};

type Props = {
  record: RecordWithAction;
};

// Карточка all-time рекорда
// карточка ведёт на страницу тренировки
export function RecordCard({ record }: Props) {
  const [bouncing, setBouncing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const bounce = useCallback(() => {
    // сброс и перезапуск анимации работают и на повторных кликах
    setBouncing(false);
    requestAnimationFrame(() => setBouncing(true));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBouncing(false), 800);
  }, []);

  const actionTitle = record.Action.alias || record.Action.title;

  return (
    <div className="card record-card-alltime">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center column-gap-2 mb-1">
          <Link
            href={`/trainings/${record.trainingId}`}
            className="text-decoration-none fw-medium"
          >
            <div className="text-muted">Новый рекорд</div>
            <div className="d-inline-flex column-gap-2 align-items-baseline">
              <span>«{actionTitle}»</span>
            </div>
          </Link>
          <div className="border border-warning rounded-circle d-inline-flex align-items-center p-4">
            <div
              role="button"
              tabIndex={0}
              className={classNames(
                "record-mark record-mark-alltime fs-4 pointer",
                bouncing && "record-trophy-bounce",
              )}
              onClick={bounce}
              onKeyDown={bounce}
              title="Круто!"
            >
              {recordIcon(record.type)}
            </div>
          </div>
        </div>
        <Link
          href={`/trainings/${record.trainingId}`}
          className="text-decoration-none"
        >
          <div className="record-value">{formatRecordValue(record)}</div>
        </Link>
        <div className="record-delta small">
          {record.previousAt ? (
            <span>{formatRecordDelta(record)} к прежнему лучшему</span>
          ) : (
            <span>
              Первое выполнение{" "}
              <b>{PurposeName[record.purpose].toLowerCase()}</b>
            </span>
          )}
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <small className="text-muted">
            {moment(record.achievedAt).format(DateFormat)}
          </small>
          <span className="badge text-bg-light">
            {recordTypeTitle(record.type)}
          </span>
        </div>
      </div>
    </div>
  );
}
