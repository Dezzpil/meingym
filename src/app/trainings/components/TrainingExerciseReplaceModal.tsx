"use client";

import { useState, useCallback } from "react";
import Modal from "react-bootstrap/Modal";
import { TrainingExerciseSearch } from "@/app/trainings/components/TrainingExerciseSearch";
import { ActionWithMusclesType } from "@/app/actions/types";
import { handleReplaceExercise } from "@/app/trainings/[id]/execute/actions";
import { getActionName } from "@/tools/action";
import { TrainingExercise } from "@prisma/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  exercise: TrainingExercise;
  actions: ActionWithMusclesType[];
  exercises: TrainingExercise[];
};

export function TrainingExerciseReplaceModal({
  isOpen,
  onClose,
  exercise,
  actions,
  exercises,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Filter out actions that are already in the training
  const exercisesMap = Object.fromEntries(
    exercises.map((e) => [e.actionId, true]),
  );
  // Make sure we don't filter out the current exercise's action
  delete exercisesMap[exercise.actionId];
  const filteredActions = actions.filter((a) => !(a.id in exercisesMap));

  const handleSelectAction = useCallback(
    async (e: any) => {
      try {
        setIsReplacing(true);
        setError(null);

        const elem = e.target;
        let actionId;

        if (elem instanceof HTMLAnchorElement) {
          actionId = Number(elem.dataset["id"]);
        } else {
          return;
        }

        if (!actionId) {
          setError("Не удалось определить ID упражнения");
          return;
        }

        const result = await handleReplaceExercise(exercise.id, actionId);

        if (result && !result.ok) {
          setError(result.error);
        } else {
          onClose();
        }
      } catch (error: any) {
        setError(error.message || "Произошла ошибка при замене упражнения");
      } finally {
        setIsReplacing(false);
      }
    },
    [exercise.id, onClose],
  );

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Выбор упражнения на замену</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {filteredActions.length > 0 ? (
          <>
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            <TrainingExerciseSearch
              baseActions={filteredActions}
              onClick={handleSelectAction}
            />
            {isReplacing && (
              <div className="d-flex justify-content-center mt-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Загрузка...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center">Нет доступных упражнений для замены</p>
        )}
      </Modal.Body>
    </Modal>
  );
}
