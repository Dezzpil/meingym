"use client";
import { useCallback, useState } from "react";
import type { Action } from "@prisma/client";
import { handleCreateMassInitial } from "@/app/actions/[id]/actions";
type Props = {
  action: Action;
};
export function ActionCreateMass({ action }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const createMass = useCallback(async () => {
    setError(null);
    setHandling(true);
    try {
      await handleCreateMassInitial(action.id);
    } catch (e: any) {
      setError(e.message);
    }
    setHandling(false);
  }, [action.id]);
  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={createMass}
        disabled={handling}
      >
        Создать стартовые значения
      </button>
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
}
