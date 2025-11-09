"use client";
import { ActionWithMusclesType } from "@/app/actions/types";
import {
  MuscleAgonyBackground,
  MuscleStabilizerBackground,
  MuscleSynergyBackground,
} from "@/app/actions/colors";

type Props = {
  action: ActionWithMusclesType;
};
export function ActionMuscles({ action }: Props) {
  return (
    <div className="muscles-container">
      <div className="mb-2">
        {action.MusclesAgony.length ? (
          <div className="d-flex flex-wrap gap-1">
            {action.MusclesAgony.map((l) => (
              <span
                className="badge bg-opacity-75 text-white"
                style={{ backgroundColor: MuscleAgonyBackground }}
                key={l.muscleId}
              >
                <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                {l.Muscle.title}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted fst-italic">Не указаны</span>
        )}
      </div>

      {action.MusclesSynergy.length && action.MusclesSynergy.length > 0 ? (
        <div className="mb-2">
          <div className="d-flex flex-wrap gap-1">
            {action.MusclesSynergy.map((l) => (
              <span
                className="badge bg-opacity-75 text-white"
                style={{ backgroundColor: MuscleSynergyBackground }}
                key={l.muscleId}
              >
                <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                {l.Muscle.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {action.MusclesStabilizer && action.MusclesStabilizer.length > 0 ? (
        <div className="mb-2">
          <div className="d-flex flex-wrap gap-1">
            {action.MusclesStabilizer.map((l) => (
              <span
                className="badge bg-opacity-75 white"
                style={{ backgroundColor: MuscleStabilizerBackground }}
                key={l.muscleId}
              >
                <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
                {l.Muscle.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
