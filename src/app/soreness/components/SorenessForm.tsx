"use client";

import React, { useState } from "react";
import { SorenessIntensity } from "@prisma/client";
import SegmentedSlider from "@/components/SegmentedSlider";
import { saveSoreness } from "@/app/soreness/actions";
import type { TrainingAwaitingSoreness } from "@/core/soreness";
import { DateFormat } from "@/tools/dates";
import moment from "moment";

const INTENSITY_OPTIONS = [
  { value: SorenessIntensity.NONE, label: "Нет", hint: "Нет" },
  { value: SorenessIntensity.LIGHT, label: "Лёгкая", hint: "При нагрузке" },
  { value: SorenessIntensity.MODERATE, label: "Умеренная", hint: "При движении" },
  { value: SorenessIntensity.SEVERE, label: "Сильная", hint: "Ограничивает" },
];

type Props = {
  training: TrainingAwaitingSoreness;
};

export function SorenessForm({ training }: Props) {
  const [values, setValues] = useState<Record<number, SorenessIntensity>>(
    () => {
      const initial: Record<number, SorenessIntensity> = {};
      for (const m of training.muscles) {
        initial[m.muscleId] = SorenessIntensity.NONE;
      }
      return initial;
    },
  );
  const [handling, setHandling] = useState(false);

  const grouped = new Map<string, typeof training.muscles>();
  for (const m of training.muscles) {
    const list = grouped.get(m.groupTitle) ?? [];
    list.push(m);
    grouped.set(m.groupTitle, list);
  }

  const handleSubmit = async () => {
    setHandling(true);
    try {
      await saveSoreness({
        trainingId: training.id,
        entries: training.muscles.map((m) => ({
          muscleId: m.muscleId,
          intensity: values[m.muscleId] ?? SorenessIntensity.NONE,
        })),
      });
    } catch (e) {
      console.error(e);
    }
    setHandling(false);
  };

  const handleSkip = async () => {
    setHandling(true);
    try {
      await saveSoreness({
        trainingId: training.id,
        entries: training.muscles.map((m) => ({
          muscleId: m.muscleId,
          intensity: SorenessIntensity.NONE,
        })),
      });
    } catch (e) {
      console.error(e);
    }
    setHandling(false);
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">
          Крепатура после тренировки {moment(training.completedAt).format(DateFormat)}
        </h5>
        <p className="text-muted small">
          Отметьте, какие мышцы болят — это поможет оценить качество нагрузки
        </p>

        {Array.from(grouped.entries()).map(([groupTitle, muscles]) => (
          <div key={groupTitle} className="mb-4">
            <div className="fw-semibold small text-muted mb-3">{groupTitle}</div>
            {muscles.map((m) => (
              <div key={m.muscleId} className="mb-3">
                <label className="form-label mb-2">{m.muscleTitle}</label>
                <SegmentedSlider
                  options={INTENSITY_OPTIONS}
                  value={values[m.muscleId] ?? SorenessIntensity.NONE}
                  onChange={(v) =>
                    setValues((prev) => ({ ...prev, [m.muscleId]: v }))
                  }
                  ariaLabel={`Крепатура: ${m.muscleTitle}`}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="d-flex gap-2 justify-content-end">
          <button
            className="btn btn-outline-secondary"
            disabled={handling}
            onClick={handleSkip}
          >
            Пропустить
          </button>
          <button
            className="btn btn-primary"
            disabled={handling}
            onClick={handleSubmit}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
