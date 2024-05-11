"use client";

import type { Muscle } from "@prisma/client";
import { Accordion } from "react-bootstrap";
import Link from "next/link";
import classNames from "classnames";
import { useMemo } from "react";

type Props = {
  muscle: Muscle & { AgonyInActions: any[]; SynergyInActions: any[] };
};
export function MuscleInActions({ muscle }: Props) {
  const list = useMemo(() => {
    return [
      { title: "Агонист", data: muscle.AgonyInActions },
      { title: "Синергист", data: muscle.SynergyInActions },
    ];
  }, [muscle.AgonyInActions, muscle.SynergyInActions]);
  return (
    <Accordion className="mb-3">
      {list.map((i) => (
        <Accordion.Item eventKey={i.title} key={i.title}>
          <Accordion.Header>
            <div className="d-flex justify-content-start gap-3">
              <span>{i.title} в упражнениях</span>
              <span
                className={classNames(
                  "badge",
                  i.data.length ? "text-bg-primary" : "text-bg-secondary",
                )}
              >
                {i.data.length}
              </span>
            </div>
          </Accordion.Header>
          <Accordion.Collapse eventKey={i.title}>
            {i.data.length ? (
              <ul className="list-group">
                {i.data.map((a) => (
                  <li
                    className="list-group-item hstack justify-content-between gap-5"
                    key={a.actionId}
                  >
                    <Link href={`/actions/${a.actionId}`}>
                      {a.Action.title}
                    </Link>
                    <span className="badge text-bg-light rounded-pill">
                      {a.Action.rig}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card">
                <div className="card-body text-muted">Нет движений</div>
              </div>
            )}
          </Accordion.Collapse>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
