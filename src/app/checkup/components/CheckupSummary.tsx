import { DifficultyChoice } from "@prisma/client";
import { DifficultyChoiceName } from "@/app/checkup/types";
import { isBurnoutRisk } from "@/core/burnout";

type CheckupData = {
  sleep: number;
  nutrition: number;
  preWorkout: number;
  stress: number;
  burnoutScore: number | null;
  difficultyChoice: DifficultyChoice | null;
};

type Props = {
  checkup: CheckupData;
};

const WELLBEING: { label: string; key: keyof CheckupData }[] = [
  { label: "Сон", key: "sleep" },
  { label: "Питание", key: "nutrition" },
  { label: "Предтреник", key: "preWorkout" },
  { label: "Стресс", key: "stress" },
];

export function CheckupSummary({ checkup }: Props) {
  const { burnoutScore, difficultyChoice } = checkup;

  return (
    <div className="mb-3">
      <div className="chip-row">
        <span className="chip-label">Чекап:</span>
        {WELLBEING.map(({ label, key }) => (
          <span className="stat-chip" key={label} title={`${label}: ${checkup[key]} из 5`}>
            <span className="chip-label">{label}</span>
            <b>{checkup[key]}</b>
          </span>
        ))}
        {burnoutScore !== null && (
          <span
            className={
              isBurnoutRisk(burnoutScore)
                ? "stat-chip text-danger"
                : "stat-chip"
            }
            title="Средний балл выгорания BAT-4 (1–5)"
          >
            <span className="chip-label">Выгорание</span>
            <b>{burnoutScore.toFixed(1)}</b>
          </span>
        )}
        {difficultyChoice && (
          <span className="tag-chip tag-chip-strong" title="Выбранный режим тренировки">
            {DifficultyChoiceName[difficultyChoice]}
          </span>
        )}
      </div>
    </div>
  );
}
