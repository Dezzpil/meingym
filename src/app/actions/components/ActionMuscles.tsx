"use client";
import { ActionMusclesType, ActionWithMusclesType } from "@/app/actions/types";
import {
  MuscleAgonyBackground,
  MuscleStabilizerBackground,
  MuscleSynergyBackground,
} from "@/app/actions/colors";
import { useEffect, useMemo } from "react";

type Props = {
  action: ActionWithMusclesType;
  short?: boolean;
};

function renderActionMusclesGroupBlock(
  muscles: Record<string, any>,
  key: string,
  backgroundColor: string,
) {
  return muscles[key].items.length ? (
    <div className="d-flex flex-wrap gap-1">
      {muscles[key].items.map((l) => (
        <span
          className="badge text-white"
          style={{ backgroundColor }}
          key={l.muscleId}
        >
          <small className="fw-medium">{l.Muscle.Group.title}:</small>{" "}
          {l.Muscle.title}
        </span>
      ))}
      {muscles[key].moreCnt > 0 && (
        <span className="badge text-white" style={{ backgroundColor }}>
          +{muscles[key].moreCnt}
        </span>
      )}
    </div>
  ) : null;
}

export function ActionMuscles({ action, short }: Props) {
  const muscles = useMemo(() => {
    const results: Record<string, any> = {};
    for (const entry of Object.entries({
      MusclesAgony: action.MusclesAgony,
      MusclesSynergy: action.MusclesSynergy,
      MusclesStabilizer: action.MusclesStabilizer,
    })) {
      const [key, value] = entry;
      if (short) {
        results[key] = {
          items: value.length ? [value[0]] : [],
          moreCnt: value.length - 1,
        };
      } else {
        results[key] = { items: value as ActionMusclesType[], moreCnt: 0 };
      }
    }
    return results;
  }, [
    action.MusclesAgony,
    action.MusclesStabilizer,
    action.MusclesSynergy,
    short,
  ]);

  return muscles ? (
    <div className="muscles-container d-flex flex-wrap column-gap-3 row-gap-1">
      {renderActionMusclesGroupBlock(
        muscles,
        "MusclesAgony",
        MuscleAgonyBackground,
      )}
      {renderActionMusclesGroupBlock(
        muscles,
        "MusclesSynergy",
        MuscleSynergyBackground,
      )}
      {renderActionMusclesGroupBlock(
        muscles,
        "MusclesStabilizer",
        MuscleStabilizerBackground,
      )}
    </div>
  ) : null;
}
