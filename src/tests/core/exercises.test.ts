import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcActionBase,
  BASE_AGONY_COEF,
  BASE_SYNERGY_COEF,
} from "@/core/exercises";

describe("calcActionBase", () => {
  it("пустые массивы → base = 0", () => {
    const result = calcActionBase([], []);
    assert.equal(result, 0);
  });

  it("один крупный агонист (sizeFactor=1.0) → base = 0.7", () => {
    const result = calcActionBase([1.0], []);
    assert.ok(Math.abs(result - BASE_AGONY_COEF) < 1e-9);
  });

  it("несколько мышц с разными sizeFactor — корректная взвешенная сумма", () => {
    // агонисты: 1.0 + 0.5 = 1.5 → 0.7 * 1.5 = 1.05
    const result = calcActionBase([1.0, 0.5], []);
    assert.ok(Math.abs(result - 1.05) < 1e-9);
  });

  it("агонисты и синергисты вносят вклад", () => {
    // агонисты: 0.8 + 0.6 = 1.4 → 0.7 * 1.4 = 0.98
    // синергисты: 0.5 + 0.3 = 0.8 → 0.3 * 0.8 = 0.24
    // итого: 0.98 + 0.24 = 1.22
    const result = calcActionBase([0.8, 0.6], [0.5, 0.3]);
    assert.ok(Math.abs(result - 1.22) < 1e-9);
  });

  it("только синергисты", () => {
    // синергисты: 1.0 → 0.3 * 1.0 = 0.3
    const result = calcActionBase([], [1.0]);
    assert.ok(Math.abs(result - BASE_SYNERGY_COEF) < 1e-9);
  });
});
