"use client";
import { useCallback, useState } from "react";
import type { Action } from "@prisma/client";
import { handleCreateStrengthInitial } from "@/app/actions/[id]/actions";
type Props = {
  action: Action;
};
export function ActionCreateStrength({ action }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const createStrength = useCallback(async () => {
    setError(null);
    setHandling(true);
    try {
      await handleCreateStrengthInitial(action.id, action.strengthAllowed);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  }, [action.id, action.strengthAllowed]);
  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={createStrength}
        disabled={handling}
      >
        Создать стартовые значения
      </button>
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
}
