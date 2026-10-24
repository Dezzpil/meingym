"use client";

import React, { useState } from "react";
import { TrainingExperience, TrainingProgression, Sex, Purpose } from "@prisma/client";
import {
  handleSetTrainingExperience,
  handleOnboardingProfileUpdate,
  handleOnboardingProgressionSetup,
  handleCompleteOnboarding,
  handleOnboardingCreateTraining,
} from "./actions";

interface OnboardingWizardProps {
  userId: string;
  currentExperience: TrainingExperience | null;
  currentProfile: {
    height: number;
    sex: Sex;
    purpose: Purpose;
  };
  currentProgression: {
    type: TrainingProgression;
    params: any;
  };
}

type OnboardingPath = "beginner" | "experienced" | null;

export function OnboardingWizard({
  userId,
  currentExperience,
  currentProfile,
  currentProgression,
}: OnboardingWizardProps) {
  const beginnerExperiences: TrainingExperience[] = ["NONE", "LESS_THAN_1", "ONE_TO_TWO"];
  const initialPath: OnboardingPath = currentExperience 
    ? (beginnerExperiences.includes(currentExperience) ? "beginner" : "experienced")
    : null;
  
  const [step, setStep] = useState(currentExperience ? 1 : 0);
  const [path, setPath] = useState<OnboardingPath>(initialPath);
  const [experience, setExperience] = useState<TrainingExperience | null>(currentExperience);
  const [profile, setProfile] = useState(currentProfile);
  const [progression, setProgression] = useState<TrainingProgression>(currentProgression.type);
  const [progressionParams, setProgressionParams] = useState(currentProgression.params);
  const [loading, setLoading] = useState(false);

  const isBeginner = path === "beginner";
  const isExperienced = path === "experienced";

  const totalSteps = isBeginner ? 6 : isExperienced ? 5 : 1;

  const handleExperienceSelect = async (exp: TrainingExperience) => {
    setLoading(true);
    try {
      await handleSetTrainingExperience({ experience: exp });
      setExperience(exp);
      
      const beginnerExperiences: TrainingExperience[] = ["NONE", "LESS_THAN_1", "ONE_TO_TWO"];
      const selectedPath = beginnerExperiences.includes(exp) ? "beginner" : "experienced";
      setPath(selectedPath);
      
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (data: typeof profile) => {
    setLoading(true);
    try {
      await handleOnboardingProfileUpdate(data);
      setProfile(data);
      setStep(step + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressionSubmit = async (prog: TrainingProgression, params: any) => {
    setLoading(true);
    try {
      await handleOnboardingProgressionSetup({ progression: prog, params });
      setProgression(prog);
      setProgressionParams(params);
      setStep(step + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTraining = async (plannedTo: Date, exerciseIds?: number[]) => {
    setLoading(true);
    try {
      const result = await handleOnboardingCreateTraining({ plannedTo, exerciseIds });
      window.location.href = `/trainings/${result.trainingId}`;
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await handleCompleteOnboarding();
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card">
          <div className="card-body">
            {step > 0 && (
              <div className="mb-4">
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                    aria-valuenow={step}
                    aria-valuemin={0}
                    aria-valuemax={totalSteps}
                  />
                </div>
                <small className="text-muted">
                  Шаг {step} из {totalSteps}
                </small>
              </div>
            )}

            {step === 0 && (
              <WelcomeStep
                onSelect={handleExperienceSelect}
                loading={loading}
              />
            )}

            {step === 1 && (
              <ProfileStep
                initialData={profile}
                onSubmit={handleProfileSubmit}
                onBack={() => setStep(0)}
                loading={loading}
                isBeginner={isBeginner}
              />
            )}

            {step === 2 && isBeginner && (
              <TrainingPeriodStep
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {((step === 2 && isExperienced) || (step === 3 && isBeginner)) && (
              <ProgressionStep
                initialProgression={progression}
                initialParams={progressionParams}
                purpose={profile.purpose}
                onSubmit={handleProgressionSubmit}
                onBack={() => setStep(step - 1)}
                loading={loading}
                isBeginner={isBeginner}
              />
            )}

            {step === 4 && isBeginner && (
              <NavigationStep
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}

            {((step === 3 && isExperienced) || (step === 5 && isBeginner)) && (
              <FirstTrainingStep
                onComplete={handleCreateTraining}
                onSkip={handleSkip}
                onBack={() => setStep(step - 1)}
                loading={loading}
                isBeginner={isBeginner}
              />
            )}

            {step === 4 && isExperienced && (
              <CompletionStep onComplete={handleComplete} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({
  onSelect,
  loading,
}: {
  onSelect: (exp: TrainingExperience) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<TrainingExperience | null>(null);

  const experiences: { value: TrainingExperience; label: string }[] = [
    { value: "NONE", label: "Нет опыта" },
    { value: "LESS_THAN_1", label: "Менее 1 года" },
    { value: "ONE_TO_TWO", label: "1-2 года" },
    { value: "THREE_TO_FIVE", label: "3-5 лет" },
    { value: "MORE_THAN_FIVE", label: "Более 5 лет" },
  ];

  return (
    <>
      <h2 className="mb-3">Добро пожаловать!</h2>
      <p className="mb-4">Давайте настроим приложение под вас.</p>
      
      <h5 className="mb-3">Какой у вас стаж тренировок?</h5>
      
      <div className="mb-4">
        {experiences.map((exp) => (
          <div key={exp.value} className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="experience"
              id={`exp-${exp.value}`}
              value={exp.value}
              checked={selected === exp.value}
              onChange={() => setSelected(exp.value)}
              disabled={loading}
            />
            <label className="form-check-label" htmlFor={`exp-${exp.value}`}>
              {exp.label}
            </label>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary w-100"
        disabled={!selected || loading}
        onClick={() => selected && onSelect(selected)}
      >
        {loading ? "Загрузка..." : "Далее"}
      </button>
    </>
  );
}

function ProfileStep({
  initialData,
  onSubmit,
  onBack,
  loading,
  isBeginner,
}: {
  initialData: { height: number; sex: Sex; purpose: Purpose };
  onSubmit: (data: typeof initialData) => void;
  onBack: () => void;
  loading: boolean;
  isBeginner: boolean;
}) {
  const [height, setHeight] = useState(initialData.height);
  const [sex, setSex] = useState<Sex>(initialData.sex);
  const [purpose, setPurpose] = useState<Purpose>(initialData.purpose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ height, sex, purpose });
  };

  return (
    <>
      <h2 className="mb-3">Профиль</h2>
      {isBeginner && (
        <div className="alert alert-info mb-3">
          Эти параметры влияют на подбор упражнений, схему подходов и расчёт прогрессии.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="height" className="form-label">
            Рост (см)
          </label>
          <input
            type="number"
            className="form-control"
            id="height"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={100}
            max={300}
            required
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="sex" className="form-label">
            Пол
          </label>
          <select
            className="form-select"
            id="sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            required
            disabled={loading}
          >
            <option value="MALE">Мужской</option>
            <option value="FEMALE">Женский</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="purpose" className="form-label">
            Цель тренировок
          </label>
          <select
            className="form-select"
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as Purpose)}
            required
            disabled={loading}
          >
            <option value="STRENGTH">Сила</option>
            <option value="MASS">Масса</option>
            <option value="LOSS">Похудение</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Назад
          </button>
          <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
            {loading ? "Сохранение..." : "Далее"}
          </button>
        </div>
      </form>
    </>
  );
}

function TrainingPeriodStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <>
      <h2 className="mb-3">Тренировочный период</h2>
      
      <div className="mb-4">
        <p>
          <strong>Тренировочный период</strong> — это цикл тренировок с определённой стратегией прогрессии.
        </p>
        <p>
          Период автоматически создаётся при первой тренировке и продолжается, пока вы не решите его завершить.
        </p>
        <div className="bg-light p-3 rounded mb-3">
          <strong>Схема работы:</strong>
          <div className="mt-2">
            Период → Прогрессия → Упражнения → Результат
          </div>
        </div>
        <p className="text-muted mb-0">
          Вам не нужно ничего настраивать сейчас — период создастся автоматически.
        </p>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
          Назад
        </button>
        <button type="button" className="btn btn-primary flex-grow-1" onClick={onNext}>
          Далее
        </button>
      </div>
    </>
  );
}

function ProgressionStep({
  initialProgression,
  initialParams,
  purpose,
  onSubmit,
  onBack,
  loading,
  isBeginner,
}: {
  initialProgression: TrainingProgression;
  initialParams: any;
  purpose: Purpose;
  onSubmit: (prog: TrainingProgression, params: any) => void;
  onBack: () => void;
  loading: boolean;
  isBeginner: boolean;
}) {
  const [progression, setProgression] = useState<TrainingProgression>(initialProgression);
  const [params, setParams] = useState(initialParams || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(progression, params);
  };

  return (
    <>
      <h2 className="mb-3">Стратегия прогрессии</h2>
      {isBeginner && (
        <div className="alert alert-info mb-3">
          <p className="mb-2">
            <strong>Прогрессия</strong> — это автоматическое изменение нагрузки от тренировки к тренировке.
          </p>
          <ul className="mb-0">
            <li><strong>NONE</strong> — ручной режим: вы сами выбираете веса и повторы</li>
            <li><strong>SIMPLE</strong> — автоматическая прогрессия: система предлагает нагрузку на основе ваших результатов</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Тип прогрессии</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="progression"
              id="prog-none"
              value="NONE"
              checked={progression === "NONE"}
              onChange={() => setProgression("NONE")}
              disabled={loading}
            />
            <label className="form-check-label" htmlFor="prog-none">
              Ручной режим (NONE)
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="progression"
              id="prog-simple"
              value="SIMPLE"
              checked={progression === "SIMPLE"}
              onChange={() => setProgression("SIMPLE")}
              disabled={loading}
            />
            <label className="form-check-label" htmlFor="prog-simple">
              Автоматическая прогрессия (SIMPLE)
            </label>
          </div>
        </div>

        {progression === "SIMPLE" && (
          <div className="alert alert-secondary">
            <p className="mb-2">
              <strong>Базовые параметры для цели «{purpose === "STRENGTH" ? "Сила" : purpose === "MASS" ? "Масса" : "Похудение"}»:</strong>
            </p>
            <p className="mb-0 small text-muted">
              Вы можете оставить значения по умолчанию или настроить их позже в профиле.
            </p>
          </div>
        )}

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack} disabled={loading}>
            Назад
          </button>
          <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
            {loading ? "Сохранение..." : "Далее"}
          </button>
        </div>
      </form>
    </>
  );
}

function NavigationStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <>
      <h2 className="mb-3">Навигация по приложению</h2>
      
      <div className="mb-4">
        <div className="mb-3">
          <h6>🏠 Главная</h6>
          <p className="text-muted mb-0">Сегодня: запланированная тренировка, вес, рекорды</p>
        </div>

        <div className="mb-3">
          <h6>💪 Тренировки</h6>
          <p className="text-muted mb-0">Календарь, создание, выполнение, повторение</p>
        </div>

        <div className="mb-3">
          <h6>🏋️ Упражнения</h6>
          <p className="text-muted mb-0">Каталог движений (глобальный, администрируемый)</p>
        </div>

        <div className="mb-3">
          <h6>⚙️ Профиль</h6>
          <p className="text-muted mb-0">Настройки, прогрессия, периоды</p>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
          Назад
        </button>
        <button type="button" className="btn btn-primary flex-grow-1" onClick={onNext}>
          Далее
        </button>
      </div>
    </>
  );
}

function FirstTrainingStep({
  onComplete,
  onSkip,
  onBack,
  loading,
  isBeginner,
}: {
  onComplete: (plannedTo: Date, exerciseIds?: number[]) => void;
  onSkip: () => void;
  onBack: () => void;
  loading: boolean;
  isBeginner: boolean;
}) {
  const [plannedTo, setPlannedTo] = useState(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(plannedTo);
  };

  return (
    <>
      <h2 className="mb-3">Первая тренировка</h2>
      
      {isBeginner ? (
        <div className="alert alert-info mb-3">
          <p className="mb-2">
            <strong>Создайте первую тренировку</strong> или пропустите этот шаг.
          </p>
          <p className="mb-0 small">
            Вы сможете добавить упражнения позже на странице тренировки.
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <h6>Как найти упражнения:</h6>
          <ul className="mb-3">
            <li><strong>По названию группы мышц</strong> — например, «Грудь» или «Спина»</li>
            <li><strong>По названию конкретной мышцы</strong> — например, «Бицепс» или «Квадрицепс»</li>
            <li><strong>По названию упражнения</strong> — например, «Жим лёжа» или «Приседания»</li>
          </ul>
          <p className="text-muted small mb-0">
            Кнопка добавления упражнения находится на странице тренировки.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="plannedTo" className="form-label">
            Дата тренировки
          </label>
          <input
            type="date"
            className="form-control"
            id="plannedTo"
            value={plannedTo.toISOString().split("T")[0]}
            onChange={(e) => setPlannedTo(new Date(e.target.value))}
            required
            disabled={loading}
          />
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack} disabled={loading}>
            Назад
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Создание..." : "Создать тренировку"}
          </button>
          <button type="button" className="btn btn-link" onClick={onSkip} disabled={loading}>
            Пропустить
          </button>
        </div>
      </form>
    </>
  );
}

function CompletionStep({ onComplete, loading }: { onComplete: () => void; loading: boolean }) {
  return (
    <>
      <h2 className="mb-3">Готово!</h2>
      <p className="mb-4">Профиль настроен. Можете создать первую тренировку.</p>

      <button
        className="btn btn-primary w-100"
        onClick={onComplete}
        disabled={loading}
      >
        {loading ? "Загрузка..." : "Начать"}
      </button>
    </>
  );
}
