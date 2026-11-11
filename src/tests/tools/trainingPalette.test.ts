import { describe, it } from "node:test";
import { expect } from "chai";
import { Purpose } from "@prisma/client";
import {
  muscleGroupColor,
  PURPOSE_COLORS,
  LOAD_REST_COLOR,
} from "@/tools/trainingPalette";

const GROUPS = [
  "Грудь",
  "Плечи",
  "Спина",
  "Поясница",
  "Руки",
  "Ноги",
  "Кора",
  "Живот",
  "Шея",
];

describe("muscleGroupColor", () => {
  it("каждая известная группа имеет свой цвет", () => {
    const colors = GROUPS.map(muscleGroupColor);
    expect(new Set(colors).size).to.equal(GROUPS.length);
  });

  it("цвет закреплён за названием и не зависит от порядка вызовов", () => {
    expect(muscleGroupColor("Плечи")).to.equal(muscleGroupColor("Плечи"));
    expect([...GROUPS].reverse().map(muscleGroupColor)).to.deep.equal(
      [...GROUPS].map(muscleGroupColor).reverse(),
    );
  });

  it("неизвестная группа всё равно получает валидный цвет", () => {
    expect(muscleGroupColor("Новая группа")).to.match(/^#[0-9a-f]{6}$/);
  });

  it("пустое название не падает", () => {
    expect(muscleGroupColor("")).to.match(/^#[0-9a-f]{6}$/);
  });

  it("цвет остатка не совпадает ни с одной группой", () => {
    expect(GROUPS.map(muscleGroupColor)).to.not.include(LOAD_REST_COLOR);
  });
});

describe("PURPOSE_COLORS", () => {
  it("покрывает все цели и различает их", () => {
    const purposes = [Purpose.STRENGTH, Purpose.MASS, Purpose.LOSS];
    const colors = purposes.map((p) => PURPOSE_COLORS[p]);
    expect(colors.every((c) => /^#[0-9a-f]{6}$/.test(c))).to.equal(true);
    expect(new Set(colors).size).to.equal(purposes.length);
  });
});