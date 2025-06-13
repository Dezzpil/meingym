"use client";

import { useMemo, useState } from "react";
import {
  Purpose,
  TrainingExercise,
  TrainingExerciseScore,
} from "@prisma/client";
import { ActionHistoryScoreChart } from "./ActionHistoryScoreChart";
import { PurposeName } from "@/tools/purposes";
import { ActionHistoryDataItems } from "@/app/actions/[id]/history/components/ActionHistoryDataItems";

export type TrainingHistoryScore = TrainingExerciseScore & {
  Exercise: TrainingExercise;
};
type Scores = Record<Purpose, TrainingHistoryScore[]>;

type Props = {
  scores: TrainingHistoryScore[];
};

export function ActionHistoryScores({ scores }: Props) {
  const [expandedPurposes, setExpandedPurposes] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (purpose: string) => {
    setExpandedPurposes((prev) => ({
      ...prev,
      [purpose]: !prev[purpose],
    }));
  };

  const items = useMemo(() => {
    // @ts-ignore
    const map: Scores = {};
    scores.forEach((score) => {
      if (!map[score.purpose]) {
        map[score.purpose] = [];
      }
      map[score.purpose].push(score);
    });
    return map;
  }, [scores]);

  return (
    <>
      {Object.entries(items).map(([purpose, scores]) => {
        const isExpanded = expandedPurposes[purpose] || false;

        return (
          <div className={"mb-5"} key={purpose}>
            <h4 id={purpose}>{PurposeName[purpose as Purpose]}</h4>
            <div className={"pointer"} onClick={() => toggleExpand(purpose)}>
              <ActionHistoryScoreChart scores={scores} />
            </div>
            {isExpanded && (
              <ActionHistoryDataItems
                scores={scores}
                purpose={purpose as Purpose}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
