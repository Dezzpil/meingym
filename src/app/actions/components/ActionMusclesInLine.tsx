"use client";
import { ActionWithMusclesType } from "@/app/actions/types";

type Props = {
  action: ActionWithMusclesType;
};
export function ActionMusclesInLine({ action }: Props) {
  return (
    <div className="muscles-container">
      <div className="mb-2">
        <div className="d-flex flex-wrap gap-1">
          {action.MusclesAgony.length && action.MusclesAgony.length > 0 ? (
            <>
              {action.MusclesAgony.map((l) => (
                <span
                  className="badge bg-success bg-opacity-75 text-white"
                  key={l.muscleId}
                >
                  <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                  {l.Muscle.title}
                </span>
              ))}
            </>
          ) : null}
          {action.MusclesSynergy.length && action.MusclesSynergy.length > 0 ? (
            <>
              {action.MusclesSynergy.map((l) => (
                <span
                  className="badge bg-primary bg-opacity-75 text-white"
                  key={l.muscleId}
                >
                  <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                  {l.Muscle.title}
                </span>
              ))}
            </>
          ) : null}
          {action.MusclesStabilizer && action.MusclesStabilizer.length > 0 ? (
            <>
              {action.MusclesStabilizer.map((l) => (
                <span
                  className="badge bg-warning bg-opacity-75 text-secondary"
                  key={l.muscleId}
                >
                  <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                  {l.Muscle.title}
                </span>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
