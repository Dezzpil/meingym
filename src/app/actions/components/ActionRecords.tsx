"use client";

import { PersonalRecord, Purpose } from "@prisma/client";
import { Nav } from "react-bootstrap";
import { RecordMark } from "@/components/records/RecordMark";
import Link from "next/link";
import { formatRecordValue } from "@/components/records/format";
import moment from "moment/moment";
import { DateFormat } from "@/tools/dates";
import { CurrentPurpose } from "@/core/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  records: PersonalRecord[];
  purpose: CurrentPurpose;
};

export function ActionRecords({ records, purpose }: Props) {
  const [currentPurpose, setCurrentPurpose] = useState<Purpose>(purpose);

  const showOnlyMass = useCallback(() => {
    setCurrentPurpose(Purpose.MASS);
  }, []);
  const showOnlyStrength = useCallback(() => {
    setCurrentPurpose(Purpose.STRENGTH);
  }, []);
  const showOnlySlim = useCallback(() => {
    setCurrentPurpose(Purpose.LOSS);
  }, []);

  useEffect(() => {
    setCurrentPurpose(purpose);
  }, [purpose]);

  const filteredRecords = useMemo(() => {
    const filtered: PersonalRecord[] = [];
    records.forEach((r) => {
      if (r.purpose === currentPurpose) filtered.push(r);
    });
    return filtered;
  }, [records, currentPurpose]);

  return records.length > 0 ? (
    <div className="card mb-3">
      <div className="card-header">Действующие рекорды</div>
      <Nav variant="tabs" defaultActiveKey={`#${purpose}`} className="mt-2">
        <Nav.Item>
          <Nav.Link href={`#${Purpose.MASS}`} onClick={showOnlyMass}>
            Масса
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href={`#${Purpose.STRENGTH}`} onClick={showOnlyStrength}>
            Сила
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href={`#${Purpose.LOSS}`} onClick={showOnlySlim}>
            Снижение веса
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <ul className="list-group list-group-flush" style={{ borderTop: 0 }}>
        {filteredRecords.length === 0 && (
          <li className="list-group-item text-muted">Рекордов пока нет ...</li>
        )}
        {filteredRecords.map((record) => (
          <li
            key={record.id}
            className="list-group-item d-flex align-items-center justify-content-between flex-wrap"
          >
            <div className="d-inline-flex column-gap-2 align-items-center">
              <Link
                href={`/trainings/${record.trainingId}`}
                className="text-decoration-none fw-medium"
              >
                {formatRecordValue(record)}
              </Link>
            </div>
            <div className="d-inline-flex column-gap-1 align-items-baseline">
              <RecordMark record={record} withIcon withTitle />
              <small className="text-muted">
                {moment(record.achievedAt).format(DateFormat)}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}
