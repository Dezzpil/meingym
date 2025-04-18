"use client";

import Link from "next/link";
import classNames from "classnames";

const tabs = {
  "": "Редактирование",
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
  current: "" | "state" | "history" | "details";
  className?: string;
}) => {
  return (
    <ul className={classNames("nav nav-tabs", className)}>
      {Object.entries(tabs).map(([key, value]) => (
        <li className={"nav-item"} key={key}>
          {current == key ? (
            <a className="nav-link active" aria-current="page" href="#">
              {value}
            </a>
          ) : (
            <Link href={`/actions/${id}/${key}`} className="nav-link">
              {value}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};
