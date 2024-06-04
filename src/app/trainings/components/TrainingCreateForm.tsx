"use client";

import { useForm } from "react-hook-form";
import { TrainingDateFormFieldType } from "@/app/trainings/types";
import { handleCreateTraining } from "@/app/trainings/create/actions";
import { useState } from "react";
import { TrainingPlannedDateForm } from "@/app/trainings/components/TrainingPlannedDateForm";

type Props = {
  btnTitle?: string;
};

export default function TrainingCreateForm({ btnTitle }: Props) {
  const form = useForm<TrainingDateFormFieldType>();
  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);

  const submit = form.handleSubmit(async (data) => {
    setHandling(true);
    setError(null);
    try {
      await handleCreateTraining(data);
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
      btnTitle={btnTitle}
    />
  );
}
