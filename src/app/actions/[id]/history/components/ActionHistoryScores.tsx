"use client";

import { useMemo } from "react";
import {
  Purpose,
  TrainingExercise,
  TrainingExerciseScore,
} from "@prisma/client";
import { ActionHistoryScoreChart } from "./ActionHistoryScoreChart";
import { ActionHistoryDataTable } from "./ActionHistoryDataTable";

export type TrainingHistoryScore = TrainingExerciseScore & {
  Exercise: TrainingExercise;
};
type Scores = Record<Purpose, TrainingHistoryScore[]>;

type Props = {
  scores: TrainingHistoryScore[];
};

export function ActionHistoryScores({ scores }: Props) {
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
      {Object.entries(items).map(([purpose, scores]) => (
        <div className={"mb-2"} key={purpose}>
          <h2>{purpose}</h2>
          <ActionHistoryScoreChart scores={scores} />
          <ActionHistoryDataTable
            scores={scores}
            purpose={purpose as Purpose}
          />
        </div>
      ))}
    </>
  );
}
