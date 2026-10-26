import { describe, it } from "node:test";
import { expect } from "chai";
import {
  computeProcessLine,
  compute4WeekMovingAverage,
  computeHeatmap,
  computeLikeForLikeComparisons,
} from "@/core/dynamicsPage";
import type { Training, TrainingPeriod, PersonalRecord } from "@prisma/client";

type TrainingLite = Pick<
  Training,
  "id" | "plannedTo" | "completedAt" | "difficultyScore" | "executedDifficultyScore" | "muscleSignature"
> & {
  Period?: Pick<TrainingPeriod, "id" | "startDate" | "endDate"> | null;
  PersonalRecords?: Pick<PersonalRecord, "id" | "achievedAt">[];
};

function makeTraining(
  id: number,
  plannedTo: Date,
  difficultyScore: number,
  executedDifficultyScore: number,
  muscleSignature: string | null,
  period?: Pick<TrainingPeriod, "id" | "startDate" | "endDate"> | null,
  hasPersonalRecord: boolean = false,
): TrainingLite {
  return {
    id,
    plannedTo,
    completedAt: new Date(),
    difficultyScore,
    executedDifficultyScore,
    muscleSignature,
    Period: period ?? null,
    PersonalRecords: hasPersonalRecord ? [{ id: 1, achievedAt: new Date() }] : [],
  } as TrainingLite;
}

describe("computeProcessLine", () => {
  it("возвращает пустой массив для пустого списка", () => {
    expect(computeProcessLine([])).to.deep.equal([]);
  });

  it("сортирует тренировки по дате", () => {
    const t1 = makeTraining(1, new Date("2026-10-15"), 10, 12, "abc");
    const t2 = makeTraining(2, new Date("2026-10-01"), 8, 9, "abc");
    const result = computeProcessLine([t1, t2]);
    expect(result[0].trainingId).to.equal(2);
    expect(result[1].trainingId).to.equal(1);
  });

  it("помечает границы периодов", () => {
    const period = { id: 1, startDate: new Date("2026-10-01"), endDate: new Date("2026-10-31") };
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 12, "abc", period);
    const t2 = makeTraining(2, new Date("2026-10-15"), 10, 12, "abc", period);
    const t3 = makeTraining(3, new Date("2026-10-31"), 10, 12, "abc", period);

    const result = computeProcessLine([t1, t2, t3]);
    expect(result[0].periodBoundary).to.equal("start");
    expect(result[1].periodBoundary).to.be.null;
    expect(result[2].periodBoundary).to.equal("end");
  });

  it("отмечает тренировки с рекордами", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 12, "abc", null, true);
    const t2 = makeTraining(2, new Date("2026-10-08"), 10, 12, "abc", null, false);

    const result = computeProcessLine([t1, t2]);
    expect(result[0].hasPersonalRecord).to.be.true;
    expect(result[1].hasPersonalRecord).to.be.false;
  });
});

describe("compute4WeekMovingAverage", () => {
  it("возвращает null для первых 3 точек", () => {
    const points = [
      { trainingId: 1, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 12, hasPersonalRecord: false, periodBoundary: null, weekNumber: 0 },
      { trainingId: 2, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 11, hasPersonalRecord: false, periodBoundary: null, weekNumber: 1 },
      { trainingId: 3, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 13, hasPersonalRecord: false, periodBoundary: null, weekNumber: 2 },
    ];
    const result = compute4WeekMovingAverage(points);
    expect(result[0]).to.be.null;
    expect(result[1]).to.be.null;
    expect(result[2]).to.be.null;
  });

  it("считает среднее по последним 4 точкам", () => {
    const points = [
      { trainingId: 1, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 10, hasPersonalRecord: false, periodBoundary: null, weekNumber: 0 },
      { trainingId: 2, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 12, hasPersonalRecord: false, periodBoundary: null, weekNumber: 1 },
      { trainingId: 3, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 14, hasPersonalRecord: false, periodBoundary: null, weekNumber: 2 },
      { trainingId: 4, plannedTo: new Date(), plannedDifficulty: 10, executedDifficulty: 16, hasPersonalRecord: false, periodBoundary: null, weekNumber: 3 },
    ];
    const result = compute4WeekMovingAverage(points);
    // Среднее: (10+12+14+16)/4 = 13
    expect(result[3]).to.be.closeTo(13, 0.01);
  });
});

describe("computeHeatmap", () => {
  it("возвращает пустой массив для пустого списка", () => {
    expect(computeHeatmap([], [])).to.deep.equal([]);
  });

  it("группирует нагрузку по неделям и группам мышц", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 12, "abc");
    const t2 = makeTraining(2, new Date("2026-10-08"), 10, 11, "abc");

    const loads = [
      { trainingId: 1, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 6 },
      { trainingId: 2, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 5 },
    ];

    const result = computeHeatmap([t1, t2], loads);
    expect(result).to.have.lengthOf(2); // 2 недели
    expect(result[0].muscleGroupTitle).to.equal("Грудь");
    expect(result[0].executedLoad).to.equal(6);
    expect(result[1].executedLoad).to.equal(5);
  });

  it("помечает конфликт восстановления", () => {
    const t1 = makeTraining(1, new Date("2026-10-01T10:00:00"), 10, 12, "abc");
    const t2 = makeTraining(2, new Date("2026-10-03T10:00:00"), 10, 11, "abc"); // через 2 дня, в ту же неделю (четверг → суббота)

    const loads = [
      { trainingId: 1, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 6 },
      { trainingId: 2, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 5 },
    ];

    const result = computeHeatmap([t1, t2], loads);
    // Обе тренировки в одной неделе, вторая через 48 часов (< 72), конфликт есть
    expect(result.length).to.be.greaterThanOrEqual(1);
    const weekWithBoth = result.find(c => c.weekNumber === result[0].weekNumber);
    expect(weekWithBoth?.hasRecoveryConflict).to.be.true;
  });

  it("помечает конфликт при тренировке менее 72 часов назад", () => {
    const t1 = makeTraining(1, new Date("2026-10-01T10:00:00"), 10, 12, "abc");
    const t2 = makeTraining(2, new Date("2026-10-01T20:00:00"), 10, 11, "abc"); // через 10 часов

    const loads = [
      { trainingId: 1, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 6 },
      { trainingId: 2, muscleGroupId: 1, muscleGroupTitle: "Грудь", plannedLoad: 5, executedLoad: 5 },
    ];

    const result = computeHeatmap([t1, t2], loads);
    expect(result).to.have.lengthOf(1);
    expect(result[0].hasRecoveryConflict).to.be.true;
  });
});

describe("computeLikeForLikeComparisons", () => {
  it("возвращает пустой массив при недостатке данных", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 12, "abc");
    expect(computeLikeForLikeComparisons([t1])).to.deep.equal([]);
  });

  it("сравнивает тренировки с одинаковой подписью", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 10, "abc");
    const t2 = makeTraining(2, new Date("2026-10-08"), 10, 12, "abc");

    const result = computeLikeForLikeComparisons([t1, t2]);
    expect(result).to.have.lengthOf(1);
    expect(result[0].currentTrainingId).to.equal(2);
    expect(result[0].previousTrainingId).to.equal(1);
    expect(result[0].delta).to.be.closeTo(20, 0.01); // (12-10)/10 * 100
    expect(result[0].daysBetween).to.equal(7);
  });

  it("игнорирует тренировки без подписи", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 10, null);
    const t2 = makeTraining(2, new Date("2026-10-08"), 10, 12, null);

    const result = computeLikeForLikeComparisons([t1, t2]);
    expect(result).to.deep.equal([]);
  });

  it("группирует по подписи мышц", () => {
    const t1 = makeTraining(1, new Date("2026-10-01"), 10, 10, "abc");
    const t2 = makeTraining(2, new Date("2026-10-08"), 10, 12, "abc");
    const t3 = makeTraining(3, new Date("2026-10-01"), 10, 10, "xyz");
    const t4 = makeTraining(4, new Date("2026-10-08"), 10, 11, "xyz");

    const result = computeLikeForLikeComparisons([t1, t2, t3, t4]);
    expect(result).to.have.lengthOf(2); // по одному сравнению на группу
  });
});
