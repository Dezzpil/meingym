"use client";
import { ActionWithMusclesType } from "@/app/actions/types";

type Props = {
  action: ActionWithMusclesType;
};
export function ActionMuscles({ action }: Props) {
  return (
    <>
      <ul className="list-inline mb-1">
        <li className="list-inline-item">
          <span className="fw-medium">Мышцы-агонисты:</span>
        </li>
        {action.MusclesAgony.length ? (
          action.MusclesAgony.map((l) => (
            <li className="list-inline-item" key={l.muscleId}>
              {l.Muscle.Group.title}: {l.Muscle.title}
            </li>
          ))
        ) : (
          <span className="text-muted">Не указаны</span>
        )}
      </ul>
      <ul className="list-inline mb-2">
        <li className="list-inline-item">
          <span className="fw-medium">Мышцы-синергисты:</span>
        </li>
        {action.MusclesSynergy.length ? (
          action.MusclesSynergy.map((l) => (
            <li className="list-inline-item" key={l.muscleId}>
              {l.Muscle.Group.title}: {l.Muscle.title}
            </li>
          ))
        ) : (
          <span className="text-muted">Не указаны</span>
        )}
      </ul>
    </>
  );
}
