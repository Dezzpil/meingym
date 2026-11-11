import { describe, it } from "node:test";
import { expect } from "chai";
import { formatShortDate } from "@/tools/dates";

describe("formatShortDate", () => {
  it("форматирует дату с русским месяцем и коротким днём недели", () => {
    expect(formatShortDate(new Date(2026, 8, 3))).to.equal("3 сен, чт");
  });

  it("принимает ISO-строку", () => {
    expect(formatShortDate("2026-11-11T10:00:00")).to.equal("11 ноя, ср");
  });

  it("покрывает все месяцы", () => {
    const months = Array.from({ length: 12 }, (_, i) =>
      formatShortDate(new Date(2026, i, 15)).split(" ")[1].replace(",", ""),
    );
    expect(months).to.deep.equal([
      "янв",
      "фев",
      "мар",
      "апр",
      "мая",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ]);
  });

  it("покрывает все дни недели начиная с воскресенья", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      formatShortDate(new Date(2026, 10, 8 + i)).split(", ")[1],
    );
    expect(days).to.deep.equal(["вс", "пн", "вт", "ср", "чт", "пт", "сб"]);
  });

  it("не дополняет число дня нулём", () => {
    expect(formatShortDate(new Date(2026, 0, 1))).to.equal("1 янв, чт");
  });
});