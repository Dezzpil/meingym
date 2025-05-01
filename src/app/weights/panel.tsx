"use client";

import type { Weight } from ".prisma/client";
import { handleWeightDelete } from "@/app/weights/actions";
import { useForm } from "react-hook-form";

type Props = {
  weight: Weight;
};

export function WeightPanel({ weight }: Props) {
  const form = useForm();
  const remove = form.handleSubmit(async () => {
    await handleWeightDelete();
  });
  return (
    <div className="mb-3 d-flex justify-content-end align-items-center">
      <div className="d-flex gap-3 align-items-center">
        <span>Ваш вес сегодня:</span>
        <span>{weight.value}</span>
        <span className="pointer text-muted" onClick={remove}>
          Удалить
        </span>
      </div>
    </div>
  );
}
