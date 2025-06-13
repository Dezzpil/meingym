import Link from "next/link";
import { ActionWithMusclesType } from "@/app/actions/types";
import type {
  ApproachesGroup,
  TrainingExerciseScore,
  ExerciseImage,
} from "@prisma/client";
import { useMemo } from "react";
import { truncateText } from "@/tools/func";
import Image from "next/image";
import { ActionMusclesInLine } from "@/app/actions/components/ActionMusclesInLine";

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
      <div className="card-header">
        <Link href={`/actions/${action.id}`}>
          {truncateText(action.alias ? action.alias : action.title, 32)}
        </Link>
      </div>
      <div className="card-body">
        <div className="d-flex flex-wrap gap-3">
          {action.ExerciseImages.length ? (
            <Image
              src={action.ExerciseImages[0].path}
              alt={action.title}
              className="img-fluid"
              width={200}
              height={200}
              style={{ maxHeight: "200px", objectFit: "contain" }}
            />
          ) : (
            <div
              className="bg-light rounded d-flex align-items-center justify-content-center"
              style={{ height: "200px", width: "200px" }}
            >
              <span className="text-muted">...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
