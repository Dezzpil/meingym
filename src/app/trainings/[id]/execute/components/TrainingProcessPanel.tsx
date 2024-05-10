"use client";

import { Training } from "@prisma/client";
import { useCallback, useState } from "react";
import { handleProcessCompletedTraining } from "@/app/trainings/[id]/execute/actions";

type Props = {
  training: Training;
};
export function TrainingProcessPanel({ training }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const handle = useCallback(async () => {
    setHandling(true);
    setError(null);
    try {
      await handleProcessCompletedTraining(training.id);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setHandling(false);
    }
  }, [training.id]);

  return (
    <div>
      <button className="btn btn-success" disabled={handling} onClick={handle}>
        Обработать результаты
      </button>
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
}
