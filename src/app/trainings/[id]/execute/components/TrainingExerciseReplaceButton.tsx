"use client";

import { useState, useCallback } from "react";
import { TrainingExercise } from "@prisma/client";
import { ActionWithMusclesType } from "@/app/actions/types";
import { TrainingExerciseReplaceModal } from "@/app/trainings/components/TrainingExerciseReplaceModal";
import { FaExchangeAlt } from "react-icons/fa";

type Props = {
  exercise: { id: number; actionId: number };
  allExercises: TrainingExercise[];
  actions: ActionWithMusclesType[];
  disabled?: boolean;
};

export function TrainingExerciseReplaceButton({
  exercise,
  allExercises,
  actions,
  disabled = false,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <button
        className="btn btn-outline-secondary d-inline-flex align-items-center"
        onClick={openModal}
        disabled={disabled}
        title="Заменить упражнение"
      >
        <FaExchangeAlt />
      </button>

      <TrainingExerciseReplaceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        exercise={exercise}
        exercises={allExercises}
        actions={actions}
      />
    </>
  );
}
