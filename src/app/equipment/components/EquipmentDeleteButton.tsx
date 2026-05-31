"use client";

import { handleEquipmentDelete } from "../actions";
import { useState } from "react";

export default function EquipmentDeleteButton({ id }: { id: number }) {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (!confirm("Удалить набор оборудования?")) return;
    setBusy(true);
    try {
      await handleEquipmentDelete(id);
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger"
      onClick={onClick}
      disabled={busy}
    >
      Удалить
    </button>
  );
}
