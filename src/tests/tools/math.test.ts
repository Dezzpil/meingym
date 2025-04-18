import { assert } from "chai";
import { test } from "node:test";
import { add, multiply } from "@/tools/math";

test("Math utility functions", async (context) => {
  await context.test("add function should correctly add two numbers", () => {
    assert.equal(add(2, 3), 5);
    assert.equal(add(-1, 1), 0);
    assert.equal(add(0, 0), 0);
  });

  await context.test("multiply function should correctly multiply two numbers", () => {
    assert.equal(multiply(2, 3), 6);
    assert.equal(multiply(-1, 1), -1);
    assert.equal(multiply(0, 5), 0);
  });
});