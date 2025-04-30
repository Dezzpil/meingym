import { assert } from "chai";
import { test, mock } from "node:test";
import { prisma } from "@/tools/db";
import * as auth from "@/tools/auth";
import * as periods from "@/core/periods";
import { handleTrainingStart } from "@/app/trainings/[id]/execute/actions";

// Mock the Prisma client
mock.method(prisma.training, "update", async () => ({
  id: 1,
  startedAt: new Date(),
  // Add other required fields with dummy values
  createdAt: new Date(),
  plannedTo: new Date(),
  completedAt: null,
  processedAt: null,
  userId: "test-user",
  periodId: 1,
  isCircuit: false,
  commonComment: null,
  completeComment: null,
  timeScoreInMins: 0,
  timeScoreInSecs: null,
  timeScoredAt: null,
}));

mock.method(prisma.trainingExercise, "updateMany", async () => ({ count: 0 }));

// Mock the auth module
mock.method(auth, "getCurrentUserId", async () => "test-user");

// Mock the periods module
const getCurrentTrainingPeriodMock = mock.method(
  periods,
  "getCurrentTrainingPeriod",
  async () => null
);

const createTrainingPeriodMock = mock.method(
  periods,
  "createTrainingPeriod",
  async () => ({
    id: 1,
    userId: "test-user",
    startDate: new Date(),
    endDate: null,
    isCurrent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
);

test("Training Actions", async (context) => {
  await context.test(
    "handleTrainingStart should create a new period if none exists",
    async () => {
      // Reset mock call counts
      getCurrentTrainingPeriodMock.mock.resetCalls();
      createTrainingPeriodMock.mock.resetCalls();

      // Call the function
      await handleTrainingStart(1, false);

      // Assert that getCurrentTrainingPeriod was called with the correct user ID
      assert.equal(getCurrentTrainingPeriodMock.mock.calls.length, 1);
      assert.equal(getCurrentTrainingPeriodMock.mock.calls[0].arguments[0], "test-user");

      // Assert that createTrainingPeriod was called with the correct user ID
      assert.equal(createTrainingPeriodMock.mock.calls.length, 1);
      assert.equal(createTrainingPeriodMock.mock.calls[0].arguments[0], "test-user");
    }
  );

  await context.test(
    "handleTrainingStart should not create a new period if one already exists",
    async () => {
      // Reset mock call counts
      getCurrentTrainingPeriodMock.mock.resetCalls();
      createTrainingPeriodMock.mock.resetCalls();

      // Mock getCurrentTrainingPeriod to return an existing period
      getCurrentTrainingPeriodMock.mock.mockImplementation(async () => ({
        id: 1,
        userId: "test-user",
        startDate: new Date(),
        endDate: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Call the function
      await handleTrainingStart(1, false);

      // Assert that getCurrentTrainingPeriod was called with the correct user ID
      assert.equal(getCurrentTrainingPeriodMock.mock.calls.length, 1);
      assert.equal(getCurrentTrainingPeriodMock.mock.calls[0].arguments[0], "test-user");

      // Assert that createTrainingPeriod was not called
      assert.equal(createTrainingPeriodMock.mock.calls.length, 0);

      // Reset the mock implementation
      getCurrentTrainingPeriodMock.mock.mockImplementation(async () => null);
    }
  );
});
