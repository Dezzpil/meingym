import { describe, it, beforeEach, after } from "node:test";
import { expect } from "chai";
import { prisma } from "@/tools/db";
import type { PersonalRecord, PersonalRecordType, Purpose } from "@prisma/client";
import { getRecordsList } from "@/mobile/records";

// ─── Save original prisma methods for restoration ───────────────────────
const originalFindMany = prisma.personalRecord.findMany;
const originalCount = prisma.personalRecord.count;

const USER_ID = "test-user-123";
const PAGE_SIZE = 50;

let findManyCalls: any[];
let countCalls: any[];
let recordsFixture: PersonalRecord[];
let totalFixture: number;

function makeRecord(overrides?: Partial<PersonalRecord>): PersonalRecord {
  return {
    id: 1,
    userId: USER_ID,
    actionId: 42,
    purpose: "MASS" as Purpose,
    type: "MAX_WEIGHT" as PersonalRecordType,
    isAllTime: true,
    value: 100,
    reps: 5,
    trainingId: 10,
    trainingExerciseId: 100,
    periodId: null,
    achievedAt: new Date("2026-08-01T10:00:00.000Z"),
    previousValue: 95,
    previousTrainingId: 9,
    previousAt: new Date("2026-07-01T10:00:00.000Z"),
    createdAt: new Date("2026-08-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("getRecordsList", () => {
  beforeEach(() => {
    findManyCalls = [];
    countCalls = [];
    recordsFixture = [];
    totalFixture = 0;

    (prisma.personalRecord as any).findMany = async (args: any) => {
      findManyCalls.push(args);
      return recordsFixture;
    };

    (prisma.personalRecord as any).count = async (args: any) => {
      countCalls.push(args);
      return totalFixture;
    };
  });

  after(() => {
    (prisma.personalRecord as any).findMany = originalFindMany;
    (prisma.personalRecord as any).count = originalCount;
  });

  it("filters records of the user by achievedAt >= since", async () => {
    const since = new Date("2026-08-01T00:00:00.000Z");
    recordsFixture = [makeRecord()];
    totalFixture = 1;

    await getRecordsList(USER_ID, since);

    expect(findManyCalls).to.have.length(1);
    expect(findManyCalls[0].where).to.deep.equal({
      userId: USER_ID,
      achievedAt: { gte: since },
    });
    // сортировка и фильтрация — на стороне БД
    expect(findManyCalls[0].orderBy).to.deep.equal({ id: "asc" });
    expect(findManyCalls[0].take).to.equal(PAGE_SIZE + 1);
  });

  it("applies cursor as id > cursor", async () => {
    const since = new Date("2026-08-01T00:00:00.000Z");

    await getRecordsList(USER_ID, since, 42);

    expect(findManyCalls[0].where).to.deep.equal({
      userId: USER_ID,
      achievedAt: { gte: since },
      id: { gt: 42 },
    });
  });

  it("counts total by since filter only, ignoring the cursor", async () => {
    const since = new Date("2026-08-01T00:00:00.000Z");
    totalFixture = 7;

    const result = await getRecordsList(USER_ID, since, 42);

    expect(countCalls).to.have.length(1);
    expect(countCalls[0].where).to.deep.equal({
      userId: USER_ID,
      achievedAt: { gte: since },
    });
    expect(result.meta.total).to.equal(7);
  });

  it("returns the whole page and no nextCursor when records fit into it", async () => {
    recordsFixture = [
      makeRecord({ id: 1 }),
      makeRecord({ id: 2 }),
      makeRecord({ id: 3 }),
    ];
    totalFixture = 3;

    const result = await getRecordsList(
      USER_ID,
      new Date("2026-08-01T00:00:00.000Z"),
    );

    expect(result.items).to.have.length(3);
    expect(result.meta.nextCursor).to.be.null;
  });

  it("cuts the extra record and returns nextCursor when there is a next page", async () => {
    recordsFixture = Array.from({ length: PAGE_SIZE + 1 }, (_, i) =>
      makeRecord({ id: i + 1 }),
    );
    totalFixture = recordsFixture.length;

    const result = await getRecordsList(
      USER_ID,
      new Date("2026-08-01T00:00:00.000Z"),
    );

    expect(result.items).to.have.length(PAGE_SIZE);
    expect(result.items[result.items.length - 1].id).to.equal(PAGE_SIZE);
    expect(result.meta.nextCursor).to.equal(PAGE_SIZE);
  });

  it("maps dates to ISO 8601 and keeps nullable fields", async () => {
    recordsFixture = [
      makeRecord({
        id: 5,
        purpose: "LOSS" as Purpose,
        type: "MAX_VOLUME" as PersonalRecordType,
        isAllTime: false,
        value: 300,
        reps: null,
        periodId: 3,
        previousValue: null,
        previousTrainingId: null,
        previousAt: null,
      }),
    ];
    totalFixture = 1;

    const result = await getRecordsList(
      USER_ID,
      new Date("2026-08-01T00:00:00.000Z"),
    );

    expect(result.items[0]).to.deep.equal({
      id: 5,
      actionId: 42,
      purpose: "LOSS",
      type: "MAX_VOLUME",
      isAllTime: false,
      value: 300,
      reps: null,
      periodId: 3,
      trainingId: 10,
      trainingExerciseId: 100,
      achievedAt: "2026-08-01T10:00:00.000Z",
      previousValue: null,
      previousTrainingId: null,
      previousAt: null,
      createdAt: "2026-08-01T12:00:00.000Z",
    });
  });

  it("returns previous record snapshot fields for non-base records", async () => {
    recordsFixture = [makeRecord()];
    totalFixture = 1;

    const result = await getRecordsList(
      USER_ID,
      new Date("2026-08-01T00:00:00.000Z"),
    );

    expect(result.items[0].previousValue).to.equal(95);
    expect(result.items[0].previousTrainingId).to.equal(9);
    expect(result.items[0].previousAt).to.equal("2026-07-01T10:00:00.000Z");
  });
});
