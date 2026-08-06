import { describe, it, before, beforeEach, after, mock } from "node:test";
import { expect } from "chai";
import { prisma } from "@/tools/db";
import type {
  MobileSyncTrainingInput,
  SyncResult,
} from "@/mobile/syncTrainings";

// ─── Dynamically-loaded module references ──────────────────────────────
// The module under test is imported AFTER mock.module registrations so
// that the mocked versions of @/core/exercises and @/jobs are used.
let syncTrainingsBatch: (
  userId: string,
  inputs: MobileSyncTrainingInput[],
) => Promise<SyncResult[]>;
let MAX_BATCH_SIZE: number;

// ─── Save original prisma methods for restoration ────────────────────────
const originalFindFirst = prisma.training.findFirst;
const originalFindUnique = prisma.training.findUnique;
const originalTransaction = prisma.$transaction;

// ─── Mutable mock implementations ─────────────────────────────────────────
// These are set in beforeEach and can be overridden in individual tests.
let createExerciseImpl: (...args: any[]) => Promise<any>;
let scheduleTrainingProcessingImpl: (...args: any[]) => Promise<any>;
let createApproachGroupImpl: (...args: any[]) => Promise<any>;

// ─── Call capture arrays (reset in beforeEach) ───────────────────────────
let findFirstCalls: any[];
let findUniqueCalls: any[];
let scheduleCalls: any[];
let txCreateCalls: any[];
let txUpdateCalls: any[];
let txDeleteManyCalls: any[];
let txExecCreateManyCalls: any[];
let createApproachGroupCalls: any[];
let txExerciseUpdateCalls: any[];

const USER_ID = "test-user-123";

// ─── Helper: build a mock transaction client ──────────────────────────────
function createMockTx() {
  return {
    training: {
      create: async (args: any) => {
        txCreateCalls.push(args);
        return { id: 1, ...args.data };
      },
      update: async (args: any) => {
        txUpdateCalls.push(args);
        return { id: args.where.id, ...args.data };
      },
    },
    trainingExercise: {
      deleteMany: async (args: any) => {
        txDeleteManyCalls.push(args);
        return { count: 0 };
      },
      update: async (args: any) => {
        txExerciseUpdateCalls.push(args);
        return {};
      },
    },
    trainingMuscleStat: {
      deleteMany: async (args: any) => {
        txDeleteManyCalls.push(args);
        return { count: 0 };
      },
    },
    trainingExerciseExecutionDuration: {
      deleteMany: async (args: any) => {
        txDeleteManyCalls.push(args);
        return { count: 0 };
      },
    },
    trainingWarmUp: {
      deleteMany: async (args: any) => {
        txDeleteManyCalls.push(args);
        return { count: 0 };
      },
    },
    trainingExerciseExecution: {
      createMany: async (args: any) => {
        txExecCreateManyCalls.push(args);
        return { count: args.data.length };
      },
    },
  };
}

// ─── Helper: build a minimal training input ──────────────────────────────
function makeTrainingInput(
  overrides?: Partial<MobileSyncTrainingInput>,
): MobileSyncTrainingInput {
  return {
    externalId: "ext-001",
    plannedTo: "2024-06-15T10:00:00.000Z",
    startedAt: null,
    completedAt: null,
    exercises: [
      {
        actionId: 1,
        priority: 1,
        purpose: "MASS",
        isPassed: false,
        approaches: [],
        executions: [
          {
            priority: 1,
            plannedWeight: 80.5,
            plannedCount: 10,
            liftedWeight: 80,
            liftedCount: 10,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("syncTrainingsBatch", () => {
  // ─── One-time setup: register module mocks, then import the module ────
  before(async () => {
    createExerciseImpl = async () => ({ id: 100 });
    scheduleTrainingProcessingImpl = async (...args: any[]) => {
      scheduleCalls.push(args);
      return { jobId: "test-job-id" };
    };
    createApproachGroupImpl = async (...args: any[]) => {
      createApproachGroupCalls.push(args);
      return { id: 200 };
    };

    // Mock @/core/exercises to avoid database access via createExercise
    (mock as any).module("@/core/exercises", {
      namedExports: {
        createExercise: (...args: any[]) => createExerciseImpl(...args),
      },
    });

    // Mock @/core/approaches to avoid database access via createApproachGroup
    (mock as any).module("@/core/approaches", {
      namedExports: {
        createApproachGroup: (...args: any[]) => createApproachGroupImpl(...args),
      },
    });

    // Mock @/jobs to prevent Redis connections and side effects
    (mock as any).module("@/jobs", {
      namedExports: {
        scheduleTrainingProcessing: (...args: any[]) =>
          scheduleTrainingProcessingImpl(...args),
      },
    });

    // Dynamically import AFTER mocks are registered
    const mod = await import("@/mobile/syncTrainings");
    syncTrainingsBatch = mod.syncTrainingsBatch;
    MAX_BATCH_SIZE = mod.MAX_BATCH_SIZE;
  });

  // ─── Per-test setup: reset state and install default prisma mocks ──────
  beforeEach(() => {
    findFirstCalls = [];
    findUniqueCalls = [];
    scheduleCalls = [];
    txCreateCalls = [];
    txUpdateCalls = [];
    txDeleteManyCalls = [];
    txExecCreateManyCalls = [];
    createApproachGroupCalls = [];
    txExerciseUpdateCalls = [];

    // Default mock implementations
    createExerciseImpl = async () => ({ id: 100 });
    scheduleTrainingProcessingImpl = async (...args: any[]) => {
      scheduleCalls.push(args);
      return { jobId: "test-job-id" };
    };
    createApproachGroupImpl = async (...args: any[]) => {
      createApproachGroupCalls.push(args);
      return { id: 200 };
    };

    // Default: no existing training found
    (prisma.training as any).findFirst = async (args: any) => {
      findFirstCalls.push(args);
      return null;
    };

    // Default: training not completed, not processed
    (prisma.training as any).findUnique = async (args: any) => {
      findUniqueCalls.push(args);
      return { processedAt: null, completedAt: null };
    };

    // Mock $transaction to pass our mock tx to the callback
    const tx = createMockTx();
    (prisma as any).$transaction = async (cb: any) => cb(tx);
  });

  // ─── Cleanup: restore original prisma methods ─────────────────────────
  after(() => {
    (prisma.training as any).findFirst = originalFindFirst;
    (prisma.training as any).findUnique = originalFindUnique;
    (prisma as any).$transaction = originalTransaction;
    mock.restoreAll();
  });

  // ─── Test 1: Create new training from scratch ─────────────────────────
  it("should create a new training from scratch when no existing training with the externalId", async () => {
    const input = makeTrainingInput();
    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].externalId).to.equal("ext-001");
    expect(results[0].status).to.equal("created");
    expect(results[0].trainingId).to.equal(1);

    // Verify training.create was called (create path, not update path)
    expect(txCreateCalls).to.have.lengthOf(1);
    expect(txUpdateCalls).to.have.lengthOf(0);

    // findFirst should have been called to check for existing training
    expect(findFirstCalls).to.have.lengthOf(1);
    expect(findFirstCalls[0].where).to.deep.include({
      userId: USER_ID,
      externalId: "ext-001",
    });

    // No scheduling since completedAt is null
    expect(scheduleCalls).to.have.lengthOf(0);
  });

  // ─── Test 2: Skip already-completed training ──────────────────────────
  it("should skip already-completed training without modifying it", async () => {
    (prisma.training as any).findFirst = async () => ({
      id: 5,
      completedAt: new Date("2024-06-10T12:00:00.000Z"),
    });

    const input = makeTrainingInput();
    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].status).to.equal("skipped");
    expect(results[0].reason).to.equal("already_completed");
    expect(results[0].trainingId).to.be.undefined;

    // No transaction should have been entered
    expect(txCreateCalls).to.have.lengthOf(0);
    expect(txUpdateCalls).to.have.lengthOf(0);
    expect(txDeleteManyCalls).to.have.lengthOf(0);
    expect(txExecCreateManyCalls).to.have.lengthOf(0);

    // No scheduling
    expect(scheduleCalls).to.have.lengthOf(0);
  });

  // ─── Test 3: Recreate on status change (planned → started) ───────────
  it("should delete children and re-insert when existing training is updated (planned → started)", async () => {
    (prisma.training as any).findFirst = async () => ({
      id: 5,
      completedAt: null,
    });

    const input = makeTrainingInput({
      startedAt: "2024-06-15T10:05:00.000Z",
    });

    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].status).to.equal("updated");
    expect(results[0].trainingId).to.equal(5);

    // Verify update path: training.update was called, not training.create
    expect(txUpdateCalls).to.have.lengthOf(1);
    expect(txCreateCalls).to.have.lengthOf(0);

    // Verify children were deleted (4 deleteMany calls for 4 child tables)
    expect(txDeleteManyCalls).to.have.lengthOf(4);

    // Verify the update data includes startedAt
    expect(txUpdateCalls[0].where.id).to.equal(5);
    expect(txUpdateCalls[0].data.startedAt).to.deep.equal(
      new Date("2024-06-15T10:05:00.000Z"),
    );

    // No scheduling since completedAt is still null
    expect(scheduleCalls).to.have.lengthOf(0);
  });

  // ─── Test 4: Recreate on status change (started → completed) ──────────
  it("should recreate and enqueue processing job when completedAt is set (started → completed)", async () => {
    (prisma.training as any).findFirst = async () => ({
      id: 5,
      completedAt: null,
    });

    // After transaction, the training has completedAt set and processedAt null
    (prisma.training as any).findUnique = async () => ({
      processedAt: null,
      completedAt: new Date("2024-06-15T11:00:00.000Z"),
    });

    const input = makeTrainingInput({
      completedAt: "2024-06-15T11:00:00.000Z",
    });

    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].status).to.equal("updated");
    expect(results[0].trainingId).to.equal(5);

    // Verify update path
    expect(txUpdateCalls).to.have.lengthOf(1);
    expect(txDeleteManyCalls).to.have.lengthOf(4);

    // Should have scheduled training processing
    expect(scheduleCalls).to.have.lengthOf(1);
    expect(scheduleCalls[0][0]).to.equal(5); // trainingId
    expect(scheduleCalls[0][1]).to.equal(USER_ID); // userId
  });

  // ─── Test 5: Idempotency ──────────────────────────────────────────────
  it("should skip on second sync of the same completed training (idempotency)", async () => {
    let findFirstCallCount = 0;
    (prisma.training as any).findFirst = async () => {
      findFirstCallCount++;
      if (findFirstCallCount === 1) {
        // First sync: no existing training → will create
        return null;
      }
      // Second sync: training already exists and is completed
      return {
        id: 1,
        completedAt: new Date("2024-06-15T11:00:00.000Z"),
      };
    };

    const input = makeTrainingInput({
      completedAt: "2024-06-15T11:00:00.000Z",
    });

    // First sync: creates the training
    const firstResults = await syncTrainingsBatch(USER_ID, [input]);
    expect(firstResults).to.have.lengthOf(1);
    expect(firstResults[0].status).to.equal("created");

    // Second sync: should skip because already completed
    const secondResults = await syncTrainingsBatch(USER_ID, [input]);
    expect(secondResults).to.have.lengthOf(1);
    expect(secondResults[0].status).to.equal("skipped");
    expect(secondResults[0].reason).to.equal("already_completed");
  });

  // ─── Test 6: Batch partial failure ────────────────────────────────────
  it("should handle batch partial failure — one training errors, others succeed", async () => {
    // createExercise throws for an invalid actionId
    createExerciseImpl = async (_trainingId: number, actionId: number) => {
      if (actionId === 99999) {
        throw new Error("Action not found");
      }
      return { id: 100 };
    };

    const badInput = makeTrainingInput({ externalId: "ext-bad" });
    badInput.exercises[0].actionId = 99999;

    const goodInput = makeTrainingInput({ externalId: "ext-good" });

    const results = await syncTrainingsBatch(USER_ID, [badInput, goodInput]);

    expect(results).to.have.lengthOf(2);

    const badResult = results.find((r) => r.externalId === "ext-bad");
    const goodResult = results.find((r) => r.externalId === "ext-good");

    expect(badResult).to.not.be.undefined;
    expect(badResult!.status).to.equal("error");
    expect(badResult!.error).to.include("Action not found");

    expect(goodResult).to.not.be.undefined;
    expect(goodResult!.status).to.equal("created");
  });

  // ─── Test 7: Batch size limit ──────────────────────────────────────────
  it("should have MAX_BATCH_SIZE set to 20", () => {
    expect(MAX_BATCH_SIZE).to.equal(20);
  });

  // ─── Test 8: Execution field mapping (plannedWeight → plannedWeigth) ──
  it("should map plannedWeight from input to plannedWeigth (misspelled) in Prisma createMany call", async () => {
    const input = makeTrainingInput();
    input.exercises[0].executions = [
      {
        priority: 1,
        plannedWeight: 85.5,
        plannedCount: 8,
        liftedWeight: 80,
        liftedCount: 8,
      },
    ];

    await syncTrainingsBatch(USER_ID, [input]);

    // Verify createMany was called
    expect(txExecCreateManyCalls).to.have.lengthOf(1);
    const createManyArg = txExecCreateManyCalls[0];
    expect(createManyArg.data).to.be.an("array");
    expect(createManyArg.data).to.have.lengthOf(1);

    const executionData = createManyArg.data[0];

    // The misspelled field should be present with the correct value
    expect(executionData).to.have.property("plannedWeigth");
    expect(executionData.plannedWeigth).to.equal(85.5);

    // The correctly-spelled field should NOT be present
    expect(executionData).to.not.have.property("plannedWeight");

    // Other fields should be mapped correctly
    expect(executionData.plannedCount).to.equal(8);
    expect(executionData.liftedWeight).to.equal(80);
    expect(executionData.liftedCount).to.equal(8);
    expect(executionData.exerciseId).to.equal(100);
  });

  // ─── Test 9: Approaches persistence — non-empty approaches ───────────
  it("should call createApproachGroup and re-link exercise when payload has approaches", async () => {
    const input = makeTrainingInput();
    input.exercises[0].approaches = [
      { priority: 0, weight: 60, count: 10 },
      { priority: 1, weight: 70, count: 8, isBoost: true },
    ];

    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].status).to.equal("created");

    // createApproachGroup should have been called once
    expect(createApproachGroupCalls).to.have.lengthOf(1);
    const [txArg, approachesArg, actionIdArg, userIdArg] = createApproachGroupCalls[0];
    expect(txArg).to.not.be.undefined; // tx client passed
    expect(approachesArg).to.be.an("array").with.lengthOf(2);
    expect(approachesArg[0]).to.deep.include({ priority: 0, weight: 60, count: 10 });
    expect(approachesArg[1]).to.deep.include({ priority: 1, weight: 70, count: 8, isBoost: true });
    expect(actionIdArg).to.equal(1);
    expect(userIdArg).to.equal(USER_ID);

    // Exercise should have been updated with the new approachGroupId
    const approachGroupUpdates = txExerciseUpdateCalls.filter(
      (c: any) => c.where?.id === 100 && c.data?.approachGroupId === 200,
    );
    expect(approachGroupUpdates).to.have.lengthOf(1);
  });

  // ─── Test 10: Approaches persistence — empty approaches ──────────────
  it("should NOT call createApproachGroup when payload has empty approaches array", async () => {
    const input = makeTrainingInput();
    input.exercises[0].approaches = [];

    const results = await syncTrainingsBatch(USER_ID, [input]);

    expect(results).to.have.lengthOf(1);
    expect(results[0].status).to.equal("created");

    // createApproachGroup should NOT have been called
    expect(createApproachGroupCalls).to.have.lengthOf(0);

    // No approachGroupId update should have happened
    const approachGroupUpdates = txExerciseUpdateCalls.filter(
      (c: any) => c.data?.approachGroupId !== undefined,
    );
    expect(approachGroupUpdates).to.have.lengthOf(0);
  });
});
