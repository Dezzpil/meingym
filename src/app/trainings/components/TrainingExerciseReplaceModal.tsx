"use client";

import { useState, useCallback, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import { TrainingExerciseSearch } from "@/app/trainings/components/TrainingExerciseSearch";
import { ActionWithMusclesType } from "@/app/actions/types";
import { handleReplaceExercise } from "@/app/trainings/[id]/execute/actions";
import { TrainingExercise } from "@prisma/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  exercise: { id: number; actionId: number };
  exercises: TrainingExercise[];
};

export function TrainingExerciseReplaceModal({
  isOpen,
  onClose,
  exercise,
  exercises,
}: Props) {
  // loading similar actions for action of this exercise
  const [isLoadingSimActions, setIsLoadingSimActions] = useState(true);
  const [simActions, setSimActions] = useState<ActionWithMusclesType[]>([]);

  useMemo(async () => {
    setIsLoadingSimActions(true);
    const url = `/api/exercises/similar?id=${exercise.id}`;
    try {
      const result = await fetch(url);
      const json = (await result.json()) as any as {
        similarActions: ActionWithMusclesType[];
      };
      setSimActions(json.similarActions as unknown as ActionWithMusclesType[]);
    } catch (error) {
      // pass
    }

    setIsLoadingSimActions(false);
  }, [exercise.id]);

  const [error, setError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Filter out actions that are already in the training
  const exercisesMap = Object.fromEntries(
    exercises.map((e) => [e.actionId, true]),
  );
  // Make sure we don't filter out the current exercise's action
  delete exercisesMap[exercise.actionId];

  const filteredActions = useMemo(() => {
    if (!simActions) return [];
    if (Object.keys(exercisesMap).length > 0) {
      return simActions.filter((a) => !(a.id in exercisesMap));
    }
    return simActions;
  }, [exercisesMap, simActions]);

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
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        {isLoadingSimActions ? (
          <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        ) : (
          <TrainingExerciseSearch
            baseActions={filteredActions}
            onClick={handleSelectAction}
          />
        )}
        {isReplacing && (
          <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
