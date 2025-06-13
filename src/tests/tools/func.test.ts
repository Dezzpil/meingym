import { assert } from "chai";
import { test } from "node:test";
import { truncateText, debounce } from "@/tools/func";

test("truncateText utility function", async (context) => {
  await context.test("should return empty string for null or undefined input", () => {
    assert.equal(truncateText(null, 10), '');
    assert.equal(truncateText(undefined, 10), '');
  });

  await context.test("should return original string if shorter than maxLength", () => {
    assert.equal(truncateText("Hello", 10), "Hello");
    assert.equal(truncateText("", 10), "");
  });

  await context.test("should truncate string and add ellipsis if longer than maxLength", () => {
    assert.equal(truncateText("Hello World", 5), "Hello...");
    assert.equal(truncateText("This is a long text", 7), "This is...");
  });

  await context.test("should handle edge case with maxLength of 0", () => {
    assert.equal(truncateText("Hello", 0), "...");
  });
});