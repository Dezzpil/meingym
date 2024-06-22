"use client";

import { useCallback } from "react";
import { handleRemoveAction } from "@/app/actions/[id]/actions";
import type { Action } from "@prisma/client";

type Props = {
  action: Action;
  trainingsCount: number;
};
export function ActionControl({ action, trainingsCount }: Props) {
  const remove = useCallback(async () => {
    await handleRemoveAction(action.id);
  }, [action.id]);
  return (
    <div className="card mb-3 text-bg-light">
      <div className="card-body">
        {trainingsCount ? (
          <span>Движение указано в {trainingsCount} тренировках</span>
        ) : (
          <div className="d-flex gap-3 align-items-baseline justify-content-between">
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
        <div className="small d-flex gap-2">
          <span>Поисковая строка:</span>
          <span className="text-muted">{action.search}</span>
        </div>
      </div>
    </div>
  );
}
