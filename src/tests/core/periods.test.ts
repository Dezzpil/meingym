import { assert } from "chai";
import { test, mock } from "node:test";
import * as trainingPeriods from "@/core/periods";
import { prisma } from "@/tools/db";

// Mock the Prisma client
mock.method(prisma.trainingPeriod, "updateMany", async () => ({ count: 1 }));
mock.method(prisma.trainingPeriod, "create", async (args: any) => {
  // Extract ProgressionStrategySimpleOpts data if it exists
  const progressionOpts = args.data.ProgressionStrategySimpleOpts?.create;

  // Create a mock ProgressionStrategySimpleOpts if it was provided
  const progressionStrategySimpleOpts = progressionOpts ? {
    id: 1,
    userId: progressionOpts.userId,
    trainingPeriodId: 1,
    strengthWorkingSetsCount: progressionOpts.strengthWorkingSetsCount,
    strengthPrepareSetsCount: progressionOpts.strengthPrepareSetsCount,
    massSetsCount: progressionOpts.massSetsCount,
    massAddDropSet: progressionOpts.massAddDropSet,
    massBigCountCoef: progressionOpts.massBigCountCoef,
    createdAt: new Date(),
    updatedAt: new Date(),
  } : null;

  // Remove the nested create from the data
  const { ProgressionStrategySimpleOpts, ...restData } = args.data;

  return {
    id: 1,
    ...restData,
    ProgressionStrategySimpleOpts: progressionStrategySimpleOpts,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});
mock.method(prisma.trainingPeriod, "findFirst", async (args: any) => {
  if (args.where.isCurrent) {
    return {
      id: 1,
      userId: args.where.userId,
      startDate: new Date(),
      endDate: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return null;
});
mock.method(prisma.trainingPeriod, "update", async (args: any) => {
  return {
    id: args.where.id,
    userId: "test-user",
    startDate: new Date(),
    endDate: new Date(),
    isCurrent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});
mock.method(prisma.trainingPeriod, "findMany", async (args: any) => {
  return [
    {
      id: 1,
      userId: args.where.userId,
      startDate: new Date(),
      endDate: null,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: args.where.userId,
      startDate: new Date(Date.now() - 86400000), // 1 day ago
      endDate: new Date(),
      isCurrent: false,
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
    },
  ];
});

test("Training Periods", async (context) => {
  const userId = "test-user";

  await context.test(
    "createTrainingPeriod should create a new training period with ProgressionStrategySimpleOpts",
    async () => {
      const period = await trainingPeriods.createTrainingPeriod(userId);
      assert.equal(period.userId, userId);
      assert.equal(period.isCurrent, true);
      assert.isNull(period.endDate);

      // Verify ProgressionStrategySimpleOpts was created
      assert.isNotNull(period.ProgressionStrategySimpleOpts);
      assert.equal(period.ProgressionStrategySimpleOpts.userId, userId);
      assert.equal(period.ProgressionStrategySimpleOpts.trainingPeriodId, period.id);
      assert.equal(period.ProgressionStrategySimpleOpts.strengthWorkingSetsCount, 4);
      assert.equal(period.ProgressionStrategySimpleOpts.strengthPrepareSetsCount, 2);
      assert.equal(period.ProgressionStrategySimpleOpts.massSetsCount, 4);
      assert.equal(period.ProgressionStrategySimpleOpts.massAddDropSet, true);
      assert.equal(period.ProgressionStrategySimpleOpts.massBigCountCoef, 1.8);
    },
  );

  await context.test(
    "getCurrentTrainingPeriod should return the current training period",
    async () => {
      const period = await trainingPeriods.getCurrentTrainingPeriod(userId);
      assert.isNotNull(period);
      assert.equal(period?.userId, userId);
      assert.equal(period?.isCurrent, true);
      assert.isNull(period?.endDate);
    },
  );

  await context.test(
    "endCurrentTrainingPeriod should end the current training period",
    async () => {
      const period = await trainingPeriods.endCurrentTrainingPeriod(userId);
      assert.isNotNull(period);
      assert.equal(period?.userId, "test-user");
      assert.equal(period?.isCurrent, false);
      assert.isNotNull(period?.endDate);
    },
  );

  await context.test(
    "getUserTrainingPeriods should return all training periods for a user",
    async () => {
      const periods = await trainingPeriods.getUserTrainingPeriods(userId);
      assert.equal(periods.length, 2);
      assert.equal(periods[0].userId, userId);
      assert.equal(periods[1].userId, userId);
    },
  );
});
