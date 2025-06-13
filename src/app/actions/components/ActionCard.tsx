import Image from "next/image";
import type {
  ApproachesGroup,
  ExerciseImage,
  ActionRig,
  TrainingExerciseScore,
} from "@prisma/client";
import { ActionMuscles } from "./ActionMuscles";
import { useMemo } from "react";
import { ActionHistoryScoreChart } from "../[id]/history/components/ActionHistoryScoreChart";
import ReactMarkdown from "react-markdown";

type Props = {
  action: any & {
    ExerciseImages?: ExerciseImage[];
    ActionMass?: { CurrentApproachGroup: ApproachesGroup }[];
    ActionStrength?: { CurrentApproachGroup: ApproachesGroup }[];
    ActionLoss?: { CurrentApproachGroup: ApproachesGroup }[];
    rig: ActionRig;
    isMarkDownInDesc?: boolean;
  };
};

function printStats(
  actionsPurpose: { CurrentApproachGroup: ApproachesGroup }[],
) {
  return actionsPurpose.length && actionsPurpose[0].CurrentApproachGroup ? (
    <div className="stats-container">
      <div className="row g-2">
        <div className="col-6 col-md-6">
          <div className="stat-item p-2 rounded bg-light bg-opacity-50">
            <div className="stat-label text-muted small">Сеты</div>
            <div className="stat-value fw-bold">
              {actionsPurpose[0].CurrentApproachGroup.count}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6">
          <div className="stat-item p-2 rounded bg-light bg-opacity-50">
            <div className="stat-label text-muted small">Повторения</div>
            <div className="stat-value fw-bold">
              {actionsPurpose[0].CurrentApproachGroup.countTotal}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6">
          <div className="stat-item p-2 rounded bg-light bg-opacity-50">
            <div className="stat-label text-muted small">Общий вес</div>
            <div className="stat-value fw-bold">
              {actionsPurpose[0].CurrentApproachGroup.sum} кг
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6">
          <div className="stat-item p-2 rounded bg-light bg-opacity-50">
            <div className="stat-label text-muted small">Средний вес</div>
            <div className="stat-value fw-bold">
              {actionsPurpose[0].CurrentApproachGroup.mean.toFixed(1)} кг
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center py-3">
      <span className="text-muted fst-italic">Нет данных</span>
    </div>
  );
}

export function ActionCard({ action }: Props) {
  const scores = useMemo(() => {
    const map: Record<string, TrainingExerciseScore[]> = {};
    for (const score of action.TrainingExerciseScore) {
      if (!(score.purpose in map)) map[score.purpose] = [];
      map[score.purpose].push(score);
    }
    return map;
  }, [action.TrainingExerciseScore]);

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <div className="card-body p-0">
        {/* Image section - full width on mobile, half width on desktop */}
        <div className="row g-0">
          <div className="col-lg-6 position-relative">
            {action.ExerciseImages && action.ExerciseImages.length > 0 ? (
              <div className="position-relative h-100 d-flex align-items-center justify-content-center p-3">
                <div className="position-relative">
                  <Image
                    src={action.ExerciseImages[0].path}
                    alt={action.title}
                    className="img-fluid rounded"
                    width={600}
                    height={600}
                    priority
                    style={{
                      maxHeight: "500px",
                      objectFit: "contain",
                      transition: "transform 0.3s ease",
                    }}
                  />
                  <div className="position-absolute bottom-0 start-0 p-3 w-100">
                    <ActionMuscles action={action} />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="bg-light rounded d-flex align-items-center justify-content-center m-3"
                style={{ height: "300px" }}
              >
                <span className="text-muted">Изображение отсутствует</span>
              </div>
            )}
          </div>

          <div className="col-lg-6">
            <div className="mb-3 text-secondary">
              {action.isMarkDownInDesc ? (
                <ReactMarkdown
                  components={{
                    h1: "h4",
                    h2: "h5",
                    h3: "b",
                    h4: "b",
                    strong: "span",
                  }}
                >
                  {action.desc}
                </ReactMarkdown>
              ) : (
                <span>{action.desc}</span>
              )}
            </div>

            <div className="mb-3">
              <a
                className="card mb-3 border-0 shadow-sm"
                href={`/actions/${action.id}/history#MASS`}
              >
                <div className="card-header">
                  <h5 className="mb-0 fs-6">На массу</h5>
                </div>
                <div className="card-body">
                  {printStats(action.ActionMass)}
                  {scores.MASS && scores.MASS.length > 1 && (
                    <ActionHistoryScoreChart
                      className={"mt-3"}
                      scores={scores.MASS as any}
                      minimal
                    />
                  )}
                </div>
              </a>

              <a
                className="card mb-3 border-0 shadow-sm"
                href={`/actions/${action.id}/history#STRENGTH`}
              >
                <div className="card-header">
                  <h5 className="mb-0 fs-6">На силу</h5>
                </div>
                <div className="card-body">
                  {printStats(action.ActionStrength)}
                  {scores.STRENGTH && scores.STRENGTH.length > 1 && (
                    <ActionHistoryScoreChart
                      className={"mt-3"}
                      scores={scores.STRENGTH as any}
                      minimal
                    />
                  )}
                </div>
              </a>

              <a
                className="card mb-3 border-0 shadow-sm"
                href={`/actions/${action.id}/history#LOSS`}
              >
                <div className="card-header">
                  <h5 className="mb-0 fs-6">На снижение веса</h5>
                </div>
                <div className="card-body">
                  {printStats(action.ActionLoss)}
                  {scores.LOSS && scores.LOSS.length > 1 && (
                    <ActionHistoryScoreChart
                      className={"mt-3"}
                      scores={scores.LOSS as any}
                      minimal
                    />
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
