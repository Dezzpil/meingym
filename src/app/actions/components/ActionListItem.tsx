import Link from "next/link";
import moment from "moment/moment";
import { DateFormat } from "@/tools/dates";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";
import { ActionWithMusclesType } from "@/app/actions/types";
import { ActionHistoryScoreChart } from "@/app/actions/[id]/history/components/ActionHistoryScoreChart";
import type {
  ApproachesGroup,
  TrainingExerciseScore,
  ExerciseImage,
} from "@prisma/client";
import { useMemo } from "react";

type Props = {
  action: any & {
    ExerciseImages?: ExerciseImage[];
  };
};

function printStats(actionsPurpose: HasCurrentApproachGroup[]) {
  return actionsPurpose.length && actionsPurpose[0].CurrentApproachGroup ? (
    <span className="d-inline-flex gap-2 text-muted">
      <span>{actionsPurpose[0].CurrentApproachGroup.count} сетов</span>
      <span>
        {actionsPurpose[0].CurrentApproachGroup.countTotal} повторений
      </span>
      <span>{actionsPurpose[0].CurrentApproachGroup.sum} кг</span>
      <span>{actionsPurpose[0].CurrentApproachGroup.mean.toFixed(1)} кг</span>
    </span>
  ) : (
    <span className="text-muted">&nbsp;&mdash;</span>
  );
}

type HasCurrentApproachGroup = { CurrentApproachGroup: ApproachesGroup };

export function ActionListItem({ action }: Props) {
  const scores = useMemo(() => {
    const map: Record<string, TrainingExerciseScore[]> = {};
    for (const score of action.TrainingExerciseScore) {
      if (!(score.purpose in map)) map[score.purpose] = [];
      map[score.purpose].push(score);
    }
    return map;
  }, [action.TrainingExerciseScore]);

  return (
    <div className="card mb-3" key={action.id}>
      <div className="card-header hstack justify-content-between">
        <Link href={`/actions/${action.id}`}>
          {action.alias ? action.alias : action.title}
        </Link>
        <div className="hstack gap-3">
          <span className="text-muted">
            {moment(action.updatedAt).format(DateFormat)}
          </span>
        </div>
      </div>
      <div className="card-body">
        {action.ExerciseImages && action.ExerciseImages.length > 0 && (
          <div className="mb-3">
            {action.ExerciseImages.find(
              (img: { isMain: any }) => img.isMain,
            ) ? (
              <img
                src={
                  action.ExerciseImages.find(
                    (img: { isMain: any }) => img.isMain,
                  )?.path
                }
                alt={action.title}
                className="img-fluid"
                style={{ maxHeight: "200px", objectFit: "contain" }}
              />
            ) : (
              <img
                src={action.ExerciseImages[0].path}
                alt={action.title}
                className="img-fluid"
                style={{ maxHeight: "200px", objectFit: "contain" }}
              />
            )}
          </div>
        )}
        <ActionMuscles action={action as ActionWithMusclesType} />

        {action.ActionMass.length > 0 && (
          <div className="mb-1">
            <span className="fw-medium">На массу: </span>
            {printStats(action.ActionMass)}
            {scores.MASS && scores.MASS.length > 1 && (
              <Link href={`/actions/${action.id}/history`}>
                <ActionHistoryScoreChart
                  className={"mt-2"}
                  scores={scores.MASS as any}
                  minimal
                />
              </Link>
            )}
          </div>
        )}
        {action.ActionStrength.length > 0 && (
          <div className="mb-1">
            <span className="fw-medium">На силу: </span>
            {printStats(action.ActionStrength)}
            {scores.STRENGTH && scores.STRENGTH.length > 1 && (
              <ActionHistoryScoreChart
                className={"mt-2"}
                scores={scores.STRENGTH as any}
                minimal
              />
            )}
          </div>
        )}
        {action.ActionLoss.length > 0 && (
          <div className="mb-1">
            <span className="fw-medium">На снижение веса: </span>
            {printStats(action.ActionLoss)}
            {scores.LOSS && scores.LOSS.length > 1 && (
              <ActionHistoryScoreChart
                className={"mt-2"}
                scores={scores.LOSS as any}
                minimal
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
