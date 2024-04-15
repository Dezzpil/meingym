"use client";

import { useCallback } from "react";
import { handleRemoveAction } from "@/app/actions/[id]/actions";

type Props = {
  actionId: number;
  trainingsCount: number;
};
export function ActionControl({ actionId, trainingsCount }: Props) {
  const remove = useCallback(async () => {
    await handleRemoveAction(actionId);
  }, [actionId]);
  return (
    <div className="card mb-3 text-bg-light">
      {trainingsCount ? (
        <div className="card-body">
          Движение указано в {trainingsCount} тренировках
        </div>
      ) : (
        <div className="card-body d-flex gap-3 align-items-baseline justify-content-between">
          <span>Движение не указано ни в одной тренировке</span>
          <button
            type="button"
            onClick={remove}
            className="btn btn-danger btn-sm"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
