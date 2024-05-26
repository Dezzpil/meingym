"use client";

import type { Training } from "@prisma/client";
import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/types";
import { useState } from "react";
import { handleChangeTrainingDate } from "@/app/trainings/[id]/actions";
import { TrainingPlannedDateForm } from "@/app/trainings/components/TrainingPlannedDateForm";

type Props = {
  training: Training;
};

export function TrainingChangeDateForm({ training }: Props) {
  const form = useForm<TrainingFormFieldsType>({
    defaultValues: { plannedTo: training.plannedTo },
  });
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);

  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleChangeTrainingDate(training.id, data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  });

  return (
    <TrainingPlannedDateForm
      submit={submit}
      handling={handling}
      error={error}
      register={form.register}
      btnTitle="Перенести"
    />
  );
}
