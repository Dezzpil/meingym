"use client";

import { useState, useCallback } from "react";
import { TrainingExercise } from "@prisma/client";
import { TrainingExerciseReplaceModal } from "@/app/trainings/components/TrainingExerciseReplaceModal";
import { BsTransparency } from "react-icons/bs";

type Props = {
  exercise: { id: number; actionId: number };
  allExercises: TrainingExercise[];
  disabled?: boolean;
};

export function TrainingExerciseReplaceButton({
  exercise,
  allExercises,
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
        className="btn btn-default d-inline-flex align-items-center"
        onClick={openModal}
        disabled={disabled}
        title="Заменить упражнение"
      >
        <BsTransparency />
      </button>

      <TrainingExerciseReplaceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        exercise={exercise}
        exercises={allExercises}
      />
    </>
  );
}
