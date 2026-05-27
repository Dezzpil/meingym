import { assert } from "chai";
import { test, mock } from "node:test";
import { prisma } from "@/tools/db";
import * as trainingPeriods from "@/core/periods";

const userId = "test-user";

// Вручную переопределяем методы Prisma, так как mock.method не дружит с Proxy от Prisma в этом окружении
const originalUpdateMany = prisma.trainingPeriod.updateMany;
const originalFindFirstOpts = prisma.progressionStrategySimpleOpts.findFirst;
const originalCreatePeriod = prisma.trainingPeriod.create;
const originalFindFirstPeriod = prisma.trainingPeriod.findFirst;
const originalUpdatePeriod = prisma.trainingPeriod.update;
const originalFindManyPeriod = prisma.trainingPeriod.findMany;

test("Training Periods", async (context) => {
  // Настройка базовых моков
  (prisma.trainingPeriod as any).updateMany = async () => ({ count: 1 });
  (prisma.progressionStrategySimpleOpts as any).findFirst = async () => null;
  (prisma.trainingPeriod as any).create = async ({ data }: any) => {
    return {
      id: 1,
      userId: data.userId,
      startDate: data.startDate,
      endDate: null,
      isCurrent: true,
      ProgressionStrategySimpleOpts: {
        id: 1,
        userId: data.userId,
        trainingPeriodId: 1,
        strengthWorkingSetsCount: 4,
        strengthPrepareSetsCount: 2,
        massSetsCount: 4,
        massAddDropSet: true,
        massBigCountCoef: 1.8,
      },
    };
  };
  (prisma.trainingPeriod as any).findFirst = async () => null;
  (prisma.trainingPeriod as any).update = async () => ({});
  (prisma.trainingPeriod as any).findMany = async () => [];

  await context.test(
    "createTrainingPeriod should create a new training period with ProgressionStrategySimpleOpts",
    async () => {
      const period = await trainingPeriods.createTrainingPeriod(userId);
      assert.equal(period.userId, userId);
      assert.equal(period.isCurrent, true);
      assert.isNull(period.endDate);

      // Verify ProgressionStrategySimpleOpts was created
      assert.isNotNull(period.ProgressionStrategySimpleOpts);
      assert.equal(period.ProgressionStrategySimpleOpts!.userId, userId);
      assert.equal(
        period.ProgressionStrategySimpleOpts!.trainingPeriodId,
        period.id,
      );
      assert.equal(
        period.ProgressionStrategySimpleOpts!.strengthWorkingSetsCount,
        4,
      );
      assert.equal(
        period.ProgressionStrategySimpleOpts!.strengthPrepareSetsCount,
        2,
      );
      assert.equal(period.ProgressionStrategySimpleOpts!.massSetsCount, 4);
      assert.equal(period.ProgressionStrategySimpleOpts!.massAddDropSet, true);
      assert.equal(period.ProgressionStrategySimpleOpts!.massBigCountCoef, 1.8);
    },
  );

  await context.test(
    "getCurrentTrainingPeriod should return the current training period",
    async () => {
      (prisma.trainingPeriod as any).findFirst = async () => ({
        id: 1,
        userId,
        isCurrent: true,
        endDate: null,
      });

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
      let findFirstCalled = false;
      (prisma.trainingPeriod as any).findFirst = async () => {
        findFirstCalled = true;
        return {
          id: 1,
          userId,
          isCurrent: true,
        };
      };
      (prisma.trainingPeriod as any).update = async () => ({
        id: 1,
        userId: "test-user",
        isCurrent: false,
        endDate: new Date(),
      });

      const period = await trainingPeriods.endCurrentTrainingPeriod(userId);
      assert.isNotNull(period);
      assert.equal(period?.userId, "test-user");
      assert.equal(period?.isCurrent, false);
      assert.isNotNull(period?.endDate);
      assert.isTrue(findFirstCalled);
    },
  );

  await context.test(
    "getUserTrainingPeriods should return all training periods for a user",
    async () => {
      (prisma.trainingPeriod as any).findMany = async () => [
        { userId, isCurrent: false },
        { userId, isCurrent: true },
      ];

      const periods = await trainingPeriods.getUserTrainingPeriods(userId);
      assert.equal(periods.length, 2);
      assert.equal(periods[0].userId, userId);
      assert.equal(periods[1].userId, userId);
    },
  );

  // Восстанавливаем оригинальные методы после тестов (хотя в тестах это обычно не обязательно, если процесс завершается)
  context.after(() => {
    (prisma.trainingPeriod as any).updateMany = originalUpdateMany;
    (prisma.progressionStrategySimpleOpts as any).findFirst =
      originalFindFirstOpts;
    (prisma.trainingPeriod as any).create = originalCreatePeriod;
    (prisma.trainingPeriod as any).findFirst = originalFindFirstPeriod;
    (prisma.trainingPeriod as any).update = originalUpdatePeriod;
    (prisma.trainingPeriod as any).findMany = originalFindManyPeriod;
  });
});
