"use client";

import type { Muscle } from "@prisma/client";
import { Accordion } from "react-bootstrap";
import Link from "next/link";

type Props = {
  muscle: Muscle & { AgonyInActions: any[]; SynergyInActions: any[] };
};
export function MuscleInActions({ muscle }: Props) {
  return (
    <Accordion className="mb-3">
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <div className="d-flex justify-content-start gap-3">
            <span>Агонист в упражнениях</span>
            <span className="badge text-bg-primary">
              {muscle.AgonyInActions.length}
            </span>
          </div>
        </Accordion.Header>
        <Accordion.Collapse eventKey="0">
          {muscle.AgonyInActions.length ? (
            <ul className="list-group">
              {muscle.AgonyInActions.map((a) => (
                <li
                  className="list-group-item hstack justify-content-between gap-5"
                  key={a.actionId}
                >
                  <Link href={`/actions/${a.actionId}`}>{a.Action.title}</Link>
                  <span className="badge text-bg-light rounded-pill">
                    {a.Action.rig}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-3">
              Нет движений, в которых мышца выступает в роли агониста
            </p>
          )}
        </Accordion.Collapse>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          <div className="d-flex justify-content-start gap-3">
            <span>Синергист в упражнениях</span>
            <span className="badge text-bg-primary">
              {muscle.SynergyInActions.length}
            </span>
          </div>
        </Accordion.Header>
        <Accordion.Collapse eventKey="1">
          {muscle.SynergyInActions.length ? (
            <ul className="list-group">
              {muscle.SynergyInActions.map((a) => (
                <li
                  className="list-group-item hstack justify-content-between gap-5"
                  key={a.actionId}
                >
                  <Link href={`/actions/${a.actionId}`}>{a.Action.title}</Link>
                  <span className="badge text-bg-light rounded-pill">
                    {a.Action.rig}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-3">
              Нет движений, в которых мышца выступает в роли синергиста
            </p>
          )}
        </Accordion.Collapse>
      </Accordion.Item>
    </Accordion>
  );
}
