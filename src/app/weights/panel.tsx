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
    <div className="mb-3 d-flex gap-3 align-items-center">
      <span>Ваш вес сегодня:</span>
      <span className="col-2">{weight.value}</span>
      <form onSubmit={remove}>
        <button className="btn btn-light">Удалить</button>
      </form>
    </div>
  );
}
