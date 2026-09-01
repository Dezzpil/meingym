"use client";

import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { TrainingExerciseReplaceButton } from "@/app/trainings/[id]/execute/components/TrainingExerciseReplaceButton";
import React, { useCallback } from "react";
import type { TrainingExercise } from "@prisma/client";
import { handleChangeExercisePriority } from "@/app/trainings/exercises/actions";
import { TrainingExerciseType } from "@/app/trainings/exercises/types";

type Props = {
  exercise: TrainingExerciseType;
  allExercises: TrainingExercise[];
};

export function TrainingExerciseItemExtraControl({
  exercise,
  allExercises,
}: Props) {
  const up = useCallback(async () => {
    await handleChangeExercisePriority(exercise.id, true);
  }, [exercise.id]);

  const down = useCallback(async () => {
    await handleChangeExercisePriority(exercise.id, false);
  }, [exercise.id]);

  return (
    <div className="d-flex column-gap-2 align-items-center">
      <button
        className="btn btn-default"
        onClick={up}
        title="Переместить вверх"
        type="button"
      >
        <FaArrowUp />
      </button>
      <button
        className="btn btn-default"
        onClick={down}
        title="Переместить вниз"
        type="button"
      >
        <FaArrowDown />
      </button>
      <TrainingExerciseReplaceButton
        exercise={exercise}
        allExercises={allExercises}
        disabled={exercise.completedAt !== null}
      />
    </div>
  );
}
