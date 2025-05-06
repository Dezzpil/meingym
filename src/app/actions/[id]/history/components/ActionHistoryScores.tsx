"use client";

import { useMemo } from "react";
import {
  Purpose,
  TrainingExercise,
  TrainingExerciseScore,
} from "@prisma/client";
import { ActionHistoryScoreChart } from "./ActionHistoryScoreChart";
import { ActionHistoryDataTable } from "./ActionHistoryDataTable";
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
        <div className={"mb-5"} key={purpose}>
          <h4>{PurposeName[purpose as Purpose]}</h4>
          <ActionHistoryScoreChart scores={scores} />
          <ActionHistoryDataItems
            scores={scores}
            purpose={purpose as Purpose}
          />
        </div>
      ))}
    </>
  );
}
