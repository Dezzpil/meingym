import { describe, it } from "node:test";
import { expect } from "chai";
import { computeTrainingDynamics, computeBatchDynamics } from "@/core/dynamics";
import type { Training } from "@prisma/client";

type TrainingLite = Pick<Training, "id" | "difficultyScore" | "muscleSignature" | "plannedTo">;

function makeTraining(
  id: number,
  difficultyScore: number,
  muscleSignature: string | null,
  plannedTo: Date,
): TrainingLite {
  return { id, difficultyScore, muscleSignature, plannedTo } as TrainingLite;
}

describe("computeTrainingDynamics", () => {
  it("возвращает hasEnoughData=false без подписи", () => {
    const t = makeTraining(1, 10, null, new Date("2026-10-01"));
    const result = computeTrainingDynamics(t, [t]);
    expect(result.hasEnoughData).to.be.false;
    expect(result.relativeToMean).to.be.null;
  });

  it("возвращает hasEnoughData=false при сложности 0", () => {
    const t = makeTraining(1, 0, "abc", new Date("2026-10-01"));
    const result = computeTrainingDynamics(t, [t]);
    expect(result.hasEnoughData).to.be.false;
  });

  it("возвращает hasEnoughData=false при менее 3 тренировках с той же подписью", () => {
    const t1 = makeTraining(1, 10, "abc", new Date("2026-10-01"));
    const t2 = makeTraining(2, 12, "abc", new Date("2026-10-08"));
    const result = computeTrainingDynamics(t1, [t1, t2]);
    expect(result.hasEnoughData).to.be.false;
    expect(result.sparkline).to.have.lengthOf(2);
  });

  it("считает относительную сложность при 3+ тренировках", () => {
    const t1 = makeTraining(1, 10, "abc", new Date("2026-10-01"));
    const t2 = makeTraining(2, 12, "abc", new Date("2026-10-08"));
    const t3 = makeTraining(3, 15, "abc", new Date("2026-10-15"));
    
    const result = computeTrainingDynamics(t3, [t1, t2, t3]);
    expect(result.hasEnoughData).to.be.true;
    // Среднее t1 и t2: (10+12)/2 = 11
    // Относительно t3 (15): (15-11)/11 * 100 = 36.36%
    expect(result.relativeToMean).to.be.closeTo(36.36, 0.01);
    expect(result.meanDifficulty).to.equal(11);
  });

  it("исключает текущую тренировку из среднего", () => {
    const t1 = makeTraining(1, 10, "abc", new Date("2026-10-01"));
    const t2 = makeTraining(2, 20, "abc", new Date("2026-10-08"));
    const t3 = makeTraining(3, 30, "abc", new Date("2026-10-15"));
    
    const result = computeTrainingDynamics(t2, [t1, t2, t3]);
    // Среднее t1 и t3: (10+30)/2 = 20
    // Относительно t2 (20): (20-20)/20 * 100 = 0%
    expect(result.relativeToMean).to.be.closeTo(0, 0.01);
  });

  it("ограничивает спарклайн 8 точками", () => {
    const trainings: TrainingLite[] = [];
    for (let i = 0; i < 10; i++) {
      trainings.push(makeTraining(i + 1, 10 + i, "abc", new Date(`2026-10-${String(i + 1).padStart(2, "0")}`)));
    }
    
    const result = computeTrainingDynamics(trainings[9], trainings);
    expect(result.sparkline).to.have.lengthOf(8);
  });

  it("игнорирует тренировки с другой подписью", () => {
    const t1 = makeTraining(1, 10, "abc", new Date("2026-10-01"));
    const t2 = makeTraining(2, 50, "xyz", new Date("2026-10-08"));
    const t3 = makeTraining(3, 12, "abc", new Date("2026-10-15"));
    const t4 = makeTraining(4, 15, "abc", new Date("2026-10-22"));
    
    const result = computeTrainingDynamics(t4, [t1, t2, t3, t4]);
    // Среднее t1 и t3: (10+12)/2 = 11
    expect(result.meanDifficulty).to.equal(11);
    expect(result.sparkline).to.have.lengthOf(3);
  });
});

describe("computeBatchDynamics", () => {
  it("возвращает карту по id тренировок", () => {
    const t1 = makeTraining(1, 10, "abc", new Date("2026-10-01"));
    const t2 = makeTraining(2, 12, "abc", new Date("2026-10-08"));
    const t3 = makeTraining(3, 15, "abc", new Date("2026-10-15"));
    
    const result = computeBatchDynamics([t1, t2, t3]);
    expect(result.size).to.equal(3);
    expect(result.get(1)?.hasEnoughData).to.be.true;
    expect(result.get(2)?.hasEnoughData).to.be.true;
    expect(result.get(3)?.hasEnoughData).to.be.true;
  });

  it("обрабатывает пустой список", () => {
    const result = computeBatchDynamics([]);
    expect(result.size).to.equal(0);
  });
});
