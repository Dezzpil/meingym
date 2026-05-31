import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUserId } from "@/tools/auth";
import EquipmentDeleteButton from "./components/EquipmentDeleteButton";
import {
  ACTION_REQUIRE_LABELS,
  ACTION_RIG_LABELS,
} from "@/app/equipment/types";
import { ActionRig } from "@prisma/client";

export default async function EquipmentListPage() {
  const userId = await getCurrentUserId();
  const items = await prisma.equipment.findMany({
    where: { userId },
    include: { Requires: true, Rigs: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link className="btn btn-primary" href="/equipment/create">
          Добавить набор
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">Пока нет ни одного набора</p>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {items.map((eq) => (
            <div
              key={eq.id}
              className="card"
              style={{ minWidth: 280, maxWidth: 360 }}
            >
              <div className="card-body d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2">
                  {eq.isDefault && <span title="Набор по умолчанию">⭐️</span>}
                  <h5 className="card-title mb-0">{eq.name}</h5>
                </div>
                {eq.Requires.length > 0 && (
                  <div className="small text-muted">
                    Оборудование:{" "}
                    {eq.Requires.map((r) => ACTION_REQUIRE_LABELS[r.type]).join(
                      ", ",
                    )}
                  </div>
                )}
                {eq.Rigs.length > 0 && (
                  <div className="small text-muted">
                    Отягощения:{" "}
                    {eq.Rigs.filter((r) => r.type !== ActionRig.OTHER)
                      .map((r) => ACTION_RIG_LABELS[r.type])
                      .join(", ")}
                  </div>
                )}
                <div className="d-flex gap-2 mt-2">
                  <Link
                    className="btn btn-sm btn-outline-primary"
                    href={`/equipment/${eq.id}`}
                  >
                    Редактировать
                  </Link>
                  <EquipmentDeleteButton id={eq.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
