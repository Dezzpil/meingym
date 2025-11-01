"use client";
import { useMemo, useState } from "react";

type Stat = {
  muscleId: number;
  asAgonyCnt: number;
  asSynerCnt: number;
  asStableCnt: number;
  Muscle: { title: string; Group: { title: string } };
};

type Props = {
  stats: Stat[];
  className?: string;
};

export function TrainingMuscleStats({ stats, className }: Props) {
  const totalMuscles = stats.length;
  const totalAgonists = useMemo(
    () => stats.filter((s) => s.asAgonyCnt > 0).length,
    [stats],
  );
  const [open, setOpen] = useState(false);

  return !stats || stats.length === 0 ? null : (
    <div className={className}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-inline-flex gap-2 align-items-center">
          <b>Мышцы-агонисты:</b>{" "}
          <span>
            {totalAgonists} / {totalMuscles}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link link-secondary p-0"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="training-muscles-list"
        >
          {open ? "Скрыть" : "Показать"}
        </button>
      </div>

      {open && (
        <ul id="training-muscles-list" className="list-inline m-0 mt-1">
          {stats.map((s) => (
            <li key={s.muscleId} className="list-inline-item me-3 mb-1">
              <span className="text-muted small">
                <span className="fw-medium">{s.Muscle.Group.title}:</span>{" "}
                {s.Muscle.title}
              </span>
              {s.asAgonyCnt > 0 && (
                <span
                  className="badge rounded-pill bg-success bg-opacity-50 text-white ms-1"
                  title="Агонист"
                >
                  {s.asAgonyCnt}
                </span>
              )}
              {s.asSynerCnt > 0 && (
                <span
                  className="badge rounded-pill bg-primary bg-opacity-50 text-white ms-1"
                  title="Синергист"
                >
                  {s.asSynerCnt}
                </span>
              )}
              {s.asStableCnt > 0 && (
                <span
                  className="badge rounded-pill bg-warning bg-opacity-50 text-secondary ms-1"
                  title="Стабилизатор"
                >
                  {s.asStableCnt}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
