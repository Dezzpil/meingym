"use client";

import React, { useEffect, useState } from "react";
import { getUnderLoadedMuscles } from "@/app/soreness/actions";
import type { UnderLoadedMuscle, SuggestedExercise } from "@/core/soreness";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { Purpose } from "@prisma/client";
import { Spinner } from "react-bootstrap";

type Props = {
  trainingId: number;
  defaultPurpose: Purpose;
  onAdded?: () => void;
  excludeActionIds?: number[];
};

export function SorenessSuggestions({
  trainingId,
  defaultPurpose,
  onAdded,
  excludeActionIds = [],
}: Props) {
  const [muscles, setMuscles] = useState<UnderLoadedMuscle[]>([]);
  const [exercises, setExercises] = useState<SuggestedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getUnderLoadedMuscles(trainingId);
        setMuscles(data.muscles);
        // Filter out exercises that are already in the training
        const exclude = new Set(excludeActionIds);
        setExercises(data.exercises.filter((e) => !exclude.has(e.actionId)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [trainingId, excludeActionIds]);

  const handleAdd = async (actionId: number) => {
    setError(null);
    setAddingId(actionId);
    try {
      const result = await handleAddExercise(trainingId, {
        actionId,
        purpose: defaultPurpose,
      });
      if (result && !(result as any).ok) {
        setError((result as any).error);
      } else {
        onAdded?.();
        // Remove from suggestions after adding
        setExercises((prev) => prev.filter((e) => e.actionId !== actionId));
      }
    } catch (e: any) {
      setError(e.message || "Ошибка при добавлении упражнения");
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <Spinner size="sm" />
        <span>Загрузка рекомендаций...</span>
      </div>
    );
  }

  if (muscles.length === 0 || exercises.length === 0) return null;

  const muscleNames = muscles.map((m) => m.muscleTitle).join(", ");

  return (
    <div className="alert alert-warning mb-3">
      <h6 className="alert-heading mb-2">
        Недогруженные мышцы
      </h6>
      <p className="mb-2 small">
        По данным крепатуры, эти мышцы были слабо нагружены в последних тренировках:{" "}
        <strong>{muscleNames}</strong>
      </p>
      <hr className="my-2" />
      <p className="mb-2 small fw-semibold">Рекомендуемые упражнения:</p>
      {error && <div className="alert alert-danger py-1 px-2 small mb-2">{error}</div>}
      <div className="d-flex flex-column gap-1">
        {exercises.slice(0, 5).map((ex) => (
          <div
            key={`${ex.actionId}-${ex.muscleId}`}
            className="d-flex justify-content-between align-items-center py-1"
          >
            <span className="small">
              {ex.actionAlias || ex.actionTitle}
              <span className="text-muted ms-2">
                ({muscles.find((m) => m.muscleId === ex.muscleId)?.groupTitle})
              </span>
            </span>
            <button
              className="btn btn-sm btn-outline-primary"
              disabled={addingId === ex.actionId}
              onClick={() => handleAdd(ex.actionId)}
            >
              {addingId === ex.actionId ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "+ Добавить"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
