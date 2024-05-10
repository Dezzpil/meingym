"use client";

import { useForm } from "react-hook-form";
import { TrainingFormFieldsType } from "@/app/trainings/types";
import { handleCreateTraining } from "@/app/trainings/create/actions";
import { useState } from "react";
import { TrainingPlannedDateForm } from "@/components/trainings/PlannedDateForm";

export default function TrainingForm() {
  const form = useForm<TrainingFormFieldsType>();
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
    />
  );
}
