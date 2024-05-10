"use client";

import type { Training } from "@prisma/client";
import { useForm } from "react-hook-form";
import { TrainingRepeatFormFieldsType } from "@/app/trainings/types";
import { useState } from "react";
import { TrainingPlannedDateForm } from "@/components/trainings/PlannedDateForm";
import { handleRepeatTraining } from "@/app/trainings/[id]/actions";

type Props = {
  training: Training;
};

export function TrainingRepeatForm({ training }: Props) {
  const form = useForm<TrainingRepeatFormFieldsType>({
    defaultValues: { fromId: training.id },
  });

  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);

  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleRepeatTraining(training.id, data);
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
      btnTitle="Запланировать повторение"
    />
  );
}
