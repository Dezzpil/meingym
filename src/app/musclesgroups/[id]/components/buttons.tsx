"use client";

import { useCallback, useState } from "react";
import { handleMuscleGroupDelete } from "@/app/musclesgroups/[id]/actions";

type Props = {
  id: number;
};

export default function MusclesGroupsButtons({ id }: Props) {
  const [handling, setHandling] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);
  const onDelete = useCallback(async () => {
    setError(null);
    setHandling(true);
    try {
      await handleMuscleGroupDelete(id);
    } catch (e: any) {
      setError(e.message);
    }
    setHandling(false);
  }, [id]);
  return (
    <div className="mb-3">
      <button className="btn btn-danger" onClick={onDelete} disabled={handling}>
        Удалить группу
      </button>
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
}
