import { describe, it } from "node:test";
import { expect } from "chai";
import { Purpose } from "@prisma/client";
import {
  topMuscleGroups,
  resolveTrainingStatus,
  computePurposeShares,
  sumTrainingVolume,
  formatTonnage,
  computeMuscleLoadBreakdown,
  type MuscleLoadInput,
} from "@/core/trainingSummary";

describe("topMuscleGroups", () => {
  it("возвращает пустой массив для пустого счётчика", () => {
    expect(topMuscleGroups({})).to.deep.equal([]);
  });

  it("берёт две группы с наибольшим числом упражнений", () => {
    const counts = { Спина: 1, Плечи: 5, Грудь: 2, Руки: 4 };
    expect(topMuscleGroups(counts)).to.deep.equal(["Плечи", "Руки"]);
  });

  it("при равенстве счётчиков сортирует по алфавиту, чтобы заголовок не прыгал", () => {
    const a = topMuscleGroups({ Руки: 3, Грудь: 3, Спина: 3 });
    const b = topMuscleGroups({ Спина: 3, Грудь: 3, Руки: 3 });
    expect(a).to.deep.equal(["Грудь", "Руки"]);
    expect(a).to.deep.equal(b);
  });

  it("отбрасывает группы с нулевым счётчиком", () => {
    expect(topMuscleGroups({ Плечи: 2, Спина: 0 })).to.deep.equal(["Плечи"]);
  });

  it("не падает, если групп меньше лимита", () => {
    expect(topMuscleGroups({ Ноги: 7 })).to.deep.equal(["Ноги"]);
  });

  it("учитывает переданный лимит", () => {
    const counts = { Плечи: 5, Руки: 4, Грудь: 2 };
    expect(topMuscleGroups(counts, 3)).to.deep.equal(["Плечи", "Руки", "Грудь"]);
    expect(topMuscleGroups(counts, 0)).to.deep.equal([]);
  });
});

describe("resolveTrainingStatus", () => {
  const now = new Date(2026, 10, 11, 14, 30);

  it("done при наличии completedAt", () => {
    expect(
      resolveTrainingStatus(
        {
          plannedTo: new Date(2026, 10, 11),
          startedAt: new Date(2026, 10, 11, 12),
          completedAt: new Date(2026, 10, 11, 13),
        },
        now,
      ),
    ).to.equal("done");
  });

  it("active при startedAt без completedAt", () => {
    expect(
      resolveTrainingStatus(
        {
          plannedTo: new Date(2026, 10, 11),
          startedAt: new Date(2026, 10, 11, 12),
          completedAt: null,
        },
        now,
      ),
    ).to.equal("active");
  });

  it("planned для сегодняшней тренировки, которая ещё не начата", () => {
    expect(
      resolveTrainingStatus(
        {
          plannedTo: new Date(2026, 10, 11),
          startedAt: null,
          completedAt: null,
        },
        now,
      ),
    ).to.equal("planned");
  });

  it("planned для будущей тренировки", () => {
    expect(
      resolveTrainingStatus(
        {
          plannedTo: new Date(2026, 10, 20),
          startedAt: null,
          completedAt: null,
        },
        now,
      ),
    ).to.equal("planned");
  });

  it("missed для прошедшей тренировки без startedAt", () => {
    expect(
      resolveTrainingStatus(
        {
          plannedTo: new Date(2026, 10, 10),
          startedAt: null,
          completedAt: null,
        },
        now,
      ),
    ).to.equal("missed");
  });

  it("сравнивает по календарному дню, а не по 24 часам", () => {
    const earlyToday = new Date(2026, 10, 11, 0, 1);
    expect(
      resolveTrainingStatus(
        { plannedTo: earlyToday, startedAt: null, completedAt: null },
        now,
      ),
    ).to.equal("planned");
  });
});

describe("computePurposeShares", () => {
  it("возвращает пустой массив без упражнений", () => {
    expect(computePurposeShares([])).to.deep.equal([]);
  });

  it("одна цель даёт 100% и isMain", () => {
    const shares = computePurposeShares([Purpose.MASS, Purpose.MASS]);
    expect(shares).to.have.lengthOf(1);
    expect(shares[0].share).to.equal(100);
    expect(shares[0].isMain).to.be.true;
    expect(shares[0].title).to.equal("На массу");
  });

  it("считает доли и помечает доминирующую цель", () => {
    const purposes = [
      Purpose.MASS,
      Purpose.MASS,
      Purpose.MASS,
      Purpose.MASS,
      Purpose.STRENGTH,
      Purpose.STRENGTH,
      Purpose.STRENGTH,
    ];
    const shares = computePurposeShares(purposes);
    expect(shares.map((s) => s.purpose)).to.deep.equal([
      Purpose.MASS,
      Purpose.STRENGTH,
    ]);
    expect(shares[0].share).to.equal(57);
    expect(shares[1].share).to.equal(43);
    expect(shares.map((s) => s.isMain)).to.deep.equal([true, false]);
  });

  it("при равенстве сохраняет фиксированный порядок целей", () => {
    const shares = computePurposeShares([Purpose.MASS, Purpose.STRENGTH]);
    expect(shares.map((s) => s.purpose)).to.deep.equal([
      Purpose.STRENGTH,
      Purpose.MASS,
    ]);
  });

  it("сумма долей не выходит за 100 более чем на округление", () => {
    const shares = computePurposeShares([
      Purpose.MASS,
      Purpose.STRENGTH,
      Purpose.LOSS,
    ]);
    const total = shares.reduce((sum, s) => sum + s.share, 0);
    expect(total).to.be.closeTo(100, 1);
  });
});

describe("sumTrainingVolume", () => {
  it("без упражнений даёт нули", () => {
    expect(sumTrainingVolume([])).to.deep.equal({ tonnageKg: 0, reps: 0 });
  });

  it("складывает тоннаж и повторы по всем упражнениям", () => {
    const volume = sumTrainingVolume([
      { liftedSum: 1027, liftedCountTotal: 38 },
      { liftedSum: 735, liftedCountTotal: 36 },
      { liftedSum: 1820, liftedCountTotal: 52 },
    ]);
    expect(volume).to.deep.equal({ tonnageKg: 3582, reps: 126 });
  });

  it("не ломается на незаполненных упражнениях", () => {
    const volume = sumTrainingVolume([
      { liftedSum: 0, liftedCountTotal: 0 },
      { liftedSum: 500, liftedCountTotal: 20 },
    ]);
    expect(volume).to.deep.equal({ tonnageKg: 500, reps: 20 });
  });
});

describe("formatTonnage", () => {
  it("до тонны показывает килограммы", () => {
    expect(formatTonnage(735)).to.equal("735 кг");
  });

  it("от тонны показывает тонны с одним знаком", () => {
    expect(formatTonnage(5590)).to.equal("5.6 т");
  });

  it("ровно тонна — это 1.0 т", () => {
    expect(formatTonnage(1000)).to.equal("1.0 т");
  });

  it("ноль не превращается в тонны", () => {
    expect(formatTonnage(0)).to.equal("0 кг");
  });
});

describe("computeMuscleLoadBreakdown", () => {
  const load = (
    title: string,
    plannedLoad: number,
    executedLoad: number,
    agonyCnt: number,
  ): MuscleLoadInput => ({ title, plannedLoad, executedLoad, agonyCnt });

  it("без данных возвращает пустую раскладку", () => {
    const b = computeMuscleLoadBreakdown([], { executed: true });
    expect(b.segments).to.deep.equal([]);
    expect(b.restShare).to.equal(0);
  });

  it("для выполненной берёт фактическую нагрузку", () => {
    const b = computeMuscleLoadBreakdown(
      [load("Плечи", 10, 30, 3), load("Руки", 10, 10, 1)],
      { executed: true },
    );
    expect(b.basis).to.equal("load");
    expect(b.segments.map((s) => s.title)).to.deep.equal(["Плечи", "Руки"]);
    expect(b.segments[0].share).to.be.closeTo(75, 0.001);
  });

  it("для запланированной берёт плановую нагрузку", () => {
    const b = computeMuscleLoadBreakdown(
      [load("Плечи", 10, 30, 3), load("Руки", 30, 10, 1)],
      { executed: false },
    );
    expect(b.segments.map((s) => s.title)).to.deep.equal(["Руки", "Плечи"]);
    expect(b.segments[0].share).to.be.closeTo(75, 0.001);
  });

  it("без пересчитанной нагрузки падает на счётчик упражнений", () => {
    const b = computeMuscleLoadBreakdown(
      [load("Плечи", 0, 0, 3), load("Руки", 0, 0, 1)],
      { executed: true },
    );
    expect(b.basis).to.equal("count");
    expect(b.segments[0].share).to.be.closeTo(75, 0.001);
  });

  it("нули и там и там дают пустую раскладку, а не деление на ноль", () => {
    const b = computeMuscleLoadBreakdown([load("Плечи", 0, 0, 0)], {
      executed: true,
    });
    expect(b.segments).to.deep.equal([]);
  });

  it("хвост за лимитом собирается в остаток, доли в сумме дают 100", () => {
    const b = computeMuscleLoadBreakdown(
      [
        load("Плечи", 0, 40, 4),
        load("Руки", 0, 30, 3),
        load("Спина", 0, 20, 2),
        load("Грудь", 0, 6, 1),
        load("Ноги", 0, 4, 1),
      ],
      { executed: true, limit: 3 },
    );
    expect(b.segments).to.have.length(3);
    expect(b.restCnt).to.equal(2);
    expect(b.restShare).to.be.closeTo(10, 0.001);
    const total = b.segments.reduce((s, x) => s + x.share, 0) + b.restShare;
    expect(total).to.be.closeTo(100, 0.001);
  });

  it("остаток перечисляет именно те группы, что не попали в подписи", () => {
    const b = computeMuscleLoadBreakdown(
      [
        load("Плечи", 0, 40, 4),
        load("Руки", 0, 30, 3),
        load("Спина", 0, 20, 2),
        load("Грудь", 0, 6, 1),
        load("Ноги", 0, 4, 1),
      ],
      { executed: true },
    );
    expect(b.segments.map((s) => s.title)).to.deep.equal([
      "Плечи",
      "Руки",
      "Спина",
    ]);
    expect(b.rest.map((s) => s.title)).to.deep.equal(["Грудь", "Ноги"]);
  });

  it("по умолчанию показывает три группы, чтобы подписи совпадали с полосой", () => {
    const b = computeMuscleLoadBreakdown(
      [
        load("Плечи", 0, 40, 4),
        load("Руки", 0, 30, 3),
        load("Спина", 0, 20, 2),
        load("Грудь", 0, 10, 1),
      ],
      { executed: true },
    );
    expect(b.segments).to.have.length(3);
    expect(b.restCnt).to.equal(1);
  });

  it("при равенстве нагрузки порядок стабилен по алфавиту", () => {
    const args: MuscleLoadInput[] = [
      load("Руки", 0, 10, 1),
      load("Грудь", 0, 10, 1),
      load("Спина", 0, 10, 1),
    ];
    const a = computeMuscleLoadBreakdown(args, { executed: true });
    const b = computeMuscleLoadBreakdown([...args].reverse(), { executed: true });
    expect(a.segments.map((s) => s.title)).to.deep.equal([
      "Грудь",
      "Руки",
      "Спина",
    ]);
    expect(a.segments).to.deep.equal(b.segments);
  });

  it("отбрасывает группы с нулевой нагрузкой", () => {
    const b = computeMuscleLoadBreakdown(
      [load("Плечи", 0, 10, 1), load("Шея", 0, 0, 0)],
      { executed: true },
    );
    expect(b.segments.map((s) => s.title)).to.deep.equal(["Плечи"]);
    expect(b.segments[0].share).to.be.closeTo(100, 0.001);
  });
});