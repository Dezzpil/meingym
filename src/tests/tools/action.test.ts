import { assert } from "chai";
import { test } from "node:test";
import { getSimilarActions, getSimilarActionIds } from "@/tools/action";

test("getSimilarActions merges both link directions without duplicates", async (context) => {
  await context.test("deduplicates a pair linked in both directions", () => {
    const action = {
      SimilarTo: [
        { Action: { id: 2, title: "Румынская тяга" } },
        { Action: { id: 3, title: "Становая" } },
      ],
      SimilarFrom: [
        { SimilarAction: { id: 2, title: "Румынская тяга" } },
        { SimilarAction: { id: 3, title: "Становая" } },
        { SimilarAction: { id: 4, title: "Присед" } },
      ],
    };

    const similar = getSimilarActions(action);
    assert.deepEqual(
      similar.map((a) => a.id),
      [2, 3, 4],
    );
  });

  await context.test("keeps single-direction links", () => {
    const action = {
      SimilarTo: [{ Action: { id: 5, title: "Жим" } }],
      SimilarFrom: [],
    };

    assert.deepEqual(
      getSimilarActions(action).map((a) => a.id),
      [5],
    );
  });

  await context.test("returns empty list without links", () => {
    assert.deepEqual(getSimilarActions({}), []);
    assert.deepEqual(getSimilarActions({ SimilarTo: null, SimilarFrom: null }), []);
  });
});

test("getSimilarActionIds merges both link directions without duplicates", async (context) => {
  await context.test("deduplicates ids of bidirectional pairs", () => {
    const action = {
      SimilarTo: [{ actionId: 2 }, { actionId: 3 }],
      SimilarFrom: [{ similarActionId: 2 }, { similarActionId: 4 }],
    };

    assert.deepEqual(getSimilarActionIds(action).sort(), [2, 3, 4]);
  });

  await context.test("returns empty list without links", () => {
    assert.deepEqual(getSimilarActionIds({}), []);
  });
});
