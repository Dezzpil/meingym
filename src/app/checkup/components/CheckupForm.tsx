"use client";

import React, { useState } from "react";
import SegmentedSlider from "@/components/SegmentedSlider";
import { DifficultyChoice } from "@prisma/client";
import { saveCheckup } from "@/app/checkup/actions";
import { calculateBurnoutScore, isBurnoutRisk } from "@/core/burnout";

type Props = {
  trainingId: number;
  isEmployed: boolean;
};

const WELLBEING_OPTIONS = [
  { value: "1", label: "1", hint: "Ужасно" },
  { value: "2", label: "2" },
  { value: "3", label: "3", hint: "Нормально" },
  { value: "4", label: "4" },
  { value: "5", label: "5", hint: "Отлично" },
];

const BURNOUT_OPTIONS = [
  { value: "1", label: "1", hint: "Никогда" },
  { value: "2", label: "2" },
  { value: "3", label: "3", hint: "Иногда" },
  { value: "4", label: "4" },
  { value: "5", label: "5", hint: "Всегда" },
];

export function CheckupForm({ trainingId, isEmployed }: Props) {
  const [sleep, setSleep] = useState("3");
  const [nutrition, setNutrition] = useState("3");
  const [preWorkout, setPreWorkout] = useState("3");
  const [stress, setStress] = useState("3");

  const [exhaustion, setExhaustion] = useState("1");
  const [distance, setDistance] = useState("1");
  const [cognitive, setCognitive] = useState("1");
  const [emotional, setEmotional] = useState("1");

  const [showBurnoutDecision, setShowBurnoutDecision] = useState(false);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [handling, setHandling] = useState(false);

  const handleSubmit = async () => {
    setHandling(true);
    try {
      const burnoutAnswers = isEmployed
        ? {
            exhaustion: parseInt(exhaustion),
            distance: parseInt(distance),
            cognitive: parseInt(cognitive),
            emotional: parseInt(emotional),
          }
        : null;

      const score = burnoutAnswers ? calculateBurnoutScore(burnoutAnswers) : 0;

      if (burnoutAnswers && isBurnoutRisk(score)) {
        setBurnoutScore(score);
        setShowBurnoutDecision(true);
        setHandling(false);
        return;
      }

      await saveCheckup({
        trainingId,
        sleep: parseInt(sleep),
        nutrition: parseInt(nutrition),
        preWorkout: parseInt(preWorkout),
        stress: parseInt(stress),
        burnoutExhaustion: burnoutAnswers?.exhaustion ?? null,
        burnoutDistance: burnoutAnswers?.distance ?? null,
        burnoutCognitive: burnoutAnswers?.cognitive ?? null,
        burnoutEmotional: burnoutAnswers?.emotional ?? null,
        difficultyChoice: DifficultyChoice.NORMAL,
      });
    } catch (e) {
      console.error(e);
    }
    setHandling(false);
  };

  const handleBurnoutChoice = async (choice: DifficultyChoice) => {
    setHandling(true);
    try {
      await saveCheckup({
        trainingId,
        sleep: parseInt(sleep),
        nutrition: parseInt(nutrition),
        preWorkout: parseInt(preWorkout),
        stress: parseInt(stress),
        burnoutExhaustion: parseInt(exhaustion),
        burnoutDistance: parseInt(distance),
        burnoutCognitive: parseInt(cognitive),
        burnoutEmotional: parseInt(emotional),
        difficultyChoice: choice,
      });
    } catch (e) {
      console.error(e);
    }
    setHandling(false);
  };

  const handleSkip = async () => {
    setHandling(true);
    try {
      await saveCheckup({
        trainingId,
        sleep: 3,
        nutrition: 3,
        preWorkout: 3,
        stress: 3,
        difficultyChoice: DifficultyChoice.NORMAL,
      });
    } catch (e) {
      console.error(e);
    }
    setHandling(false);
  };

  if (showBurnoutDecision) {
    return (
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Уровень выгорания: {burnoutScore.toFixed(1)}/5</h5>
          <p className="text-muted">
            Ты выгораешь. Тренировка поможет — погнали?
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-danger"
              disabled={handling}
              onClick={() => handleBurnoutChoice(DifficultyChoice.BOOST)}
            >
              Ебашить
            </button>
            <button
              className="btn btn-outline-secondary"
              disabled={handling}
              onClick={() => handleBurnoutChoice(DifficultyChoice.NORMAL)}
            >
              Как есть
            </button>
            <button
              className="btn btn-outline-info"
              disabled={handling}
              onClick={() => handleBurnoutChoice(DifficultyChoice.EASY)}
            >
              Пощадить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Чекап перед тренировкой</h5>

        <div className="mb-3">
          <label className="form-label">Сон</label>
          <SegmentedSlider
            options={WELLBEING_OPTIONS}
            value={sleep}
            onChange={setSleep}
            ariaLabel="Качество сна"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Питание</label>
          <SegmentedSlider
            options={WELLBEING_OPTIONS}
            value={nutrition}
            onChange={setNutrition}
            ariaLabel="Качество питания"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Предтреник</label>
          <SegmentedSlider
            options={WELLBEING_OPTIONS}
            value={preWorkout}
            onChange={setPreWorkout}
            ariaLabel="Предтренировочное состояние"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Стресс</label>
          <SegmentedSlider
            options={WELLBEING_OPTIONS}
            value={stress}
            onChange={setStress}
            ariaLabel="Уровень стресса"
          />
        </div>

        {isEmployed && (
          <>
            <hr />
            <p className="text-muted small">
              Оцени своё состояние на работе за последние пару недель
            </p>

            <div className="mb-3">
              <label className="form-label">Ментальное истощение</label>
              <SegmentedSlider
                options={BURNOUT_OPTIONS}
                value={exhaustion}
                onChange={setExhaustion}
                ariaLabel="Ментальное истощение"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Потеря интереса</label>
              <SegmentedSlider
                options={BURNOUT_OPTIONS}
                value={distance}
                onChange={setDistance}
                ariaLabel="Потеря интереса к работе"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Трудно сосредоточиться</label>
              <SegmentedSlider
                options={BURNOUT_OPTIONS}
                value={cognitive}
                onChange={setCognitive}
                ariaLabel="Когнитивные трудности"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Эмоциональные срывы</label>
              <SegmentedSlider
                options={BURNOUT_OPTIONS}
                value={emotional}
                onChange={setEmotional}
                ariaLabel="Эмоциональная нестабильность"
              />
            </div>
          </>
        )}

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
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}
