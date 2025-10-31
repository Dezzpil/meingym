"use client";

import React from "react";
import { handleTrainingDelete } from "@/app/trainings/[id]/actions";

export function DeleteTrainingButton({ id }: { id: number }) {
  const action = handleTrainingDelete.bind(null, id);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const ok = window.confirm(
      "Вы действительно хотите удалить тренировку? Это действие нельзя будет отменить.",
    );
    if (!ok) e.preventDefault();
  };
  return (
    <form action={action} onSubmit={onSubmit} className="d-inline">
      <button type="submit" className="btn btn-outline-danger">
        Удалить тренировку
      </button>
    </form>
  );
}
