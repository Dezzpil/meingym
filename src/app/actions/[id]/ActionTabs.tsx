"use client";

import Link from "next/link";
import classNames from "classnames";

const tabs = {
  "": "Редактирование",
  card: "Карточка",
  state: "Подходы",
  history: "История",
  details: "Детали",
};

export const ActionTabs = ({
  id,
  current,
  className,
}: {
  id: number;
  current: "" | "card" | "state" | "history" | "details";
  className?: string;
}) => {
  return (
    <ul className={classNames("nav nav-pills", className)}>
      {Object.entries(tabs).map(([key, value]) => (
        <li className="nav-item" key={key}>
          {current == key ? (
            <a
              className="nav-link active rounded-top fw-medium"
              aria-current="page"
              href="#"
            >
              {value}
            </a>
          ) : (
            <Link
              href={`/actions/${id}/${key}`}
              className="nav-link text-secondary rounded-top"
              style={{ transition: "all 0.2s ease" }}
            >
              {value}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};
