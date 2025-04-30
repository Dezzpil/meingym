"use client";

import { useForm } from "react-hook-form";
import { ProfileFormFieldsType } from "@/app/profile/types";
import type { UserInfo } from "@prisma/client";
import { Purpose, Sex, TrainingProgression } from "@prisma/client";
import { useState } from "react";
import { handleProfileUpdate } from "@/app/profile/actions";

type Props = {
  userInfo: UserInfo;
};

export function ProfileForm({ userInfo }: Props) {
  const form = useForm<ProfileFormFieldsType>({ defaultValues: userInfo });

  const [error, setError] = useState<string | null>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const submit = form.handleSubmit(async (data) => {
    setError(null);
    setHandling(true);
    try {
      await handleProfileUpdate(data);
    } catch (e: any) {
      setError(e.message);
      alert(e.message);
    }

    setHandling(false);
  });

  return (
    <form onSubmit={submit} className="mb-4">
      <div className=" mb-2">
        <label className="form-label" htmlFor="height">
          Рост
        </label>
        <input
          className="form-control"
          type="number"
          {...form.register("height", { valueAsNumber: true })}
        />
      </div>
      <div className="mb-2">
        <label className="form-label" htmlFor="sex">
          Пол
        </label>
        <select className="form-control" {...form.register("sex")}>
          <option value={Sex.MALE}>Мужчина</option>
          <option value={Sex.FEMALE}>Женщина</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="form-label" htmlFor="purpose">
          Цель тренировок
        </label>
        <select className="form-control" {...form.register("purpose")}>
          <option value={Purpose.STRENGTH}>Сила</option>
          <option value={Purpose.MASS}>Масса</option>
          <option value={Purpose.LOSS}>Снижение веса</option>
        </select>
      </div>
      <div className="mb-2 d-flex justify-content-end">
        <button className="btn btn-primary" disabled={handling}>
          Сохранить
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </form>
  );
}
