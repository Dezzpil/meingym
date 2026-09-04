import { describe, it, beforeEach, after } from "node:test";
import { expect } from "chai";
import { prisma } from "@/tools/db";
import {
  calculateTrainingScores,
  MobileScoresInputError,
  type MobileScoreExerciseInput,
} from "@/mobile/scores";

// ─── Save original prisma methods for restoration ───────────────────────
const originalActionFindMany = prisma.action.findMany;
const originalWeightFindFirst = prisma.weight.findFirst;

const USER_ID = "test-user-123";

// ─── Fixtures ──────────────────────────────────────────────────────────
type ActionFixture = {
  id: number;
  base: number;
  rig: string;
  isDurationBased: boolean;
};

let actionsFixture: ActionFixture[];
let weightFindFirstCalls: any[];

function makeExercise(
  overrides?: Partial<MobileScoreExerciseInput>,
): MobileScoreExerciseInput {
  return {
    id: 1,
    purpose: "MASS",
    approaches: [{ weight: 60, count: 10 }],
    ...overrides,
  };
}

describe("calculateTrainingScores", () => {
  beforeEach(() => {
    actionsFixture = [];
    weightFindFirstCalls = [];

    (prisma.action as any).findMany = async (args: any) => {
      const ids: number[] = args.where.id.in;
      return actionsFixture.filter((action) => ids.includes(action.id));
    };

    (prisma.weight as any).findFirst = async (args: any) => {
      weightFindFirstCalls.push(args);
      return { id: 1, userId: args.where.userId, value: 80, createdAt: new Date() };
    };
  });

  after(() => {
    (prisma.action as any).findMany = originalActionFindMany;
    (prisma.weight as any).findFirst = originalWeightFindFirst;
  });

  it("estimates time by purpose norm and difficulty by action base", async () => {
    actionsFixture = [{ id: 1, base: 2, rig: "BARBELL", isDurationBased: false }];

    const result = await calculateTrainingScores(USER_ID, [
      makeExercise({
        approaches: [
          { weight: 60, count: 10 },
          { weight: 70, count: 8 },
        ],
      }),
    ]);

    // MASS: 3.5 мин на подход × 2 подхода
    expect(result.timeScoreInMins).to.equal(7);
    expect(result.timeScoreInSecs).to.equal(420);

    // статистика подходов: sum = 60×10 + 70×8, mean = 65, max = 70, countTotal = 18, countMean = 9
    const expectedPreview =
      0.5 * Math.log(65) +
      0.25 * Math.log(9) +
      0.25 * Math.log(1160) +
      0.1 * Math.log(70);
    expect(result.difficultyScore).to.be.closeTo(2 * expectedPreview, 1e-9);

    expect(result.exercises).to.have.length(1);
    expect(result.exercises[0]).to.deep.include({
      id: 1,
      purpose: "MASS",
      approachesCount: 2,
      timeScoreInMins: 7,
      timeScoreInSecs: 420,
    });
    expect(result.exercises[0].difficultyScore).to.be.closeTo(
      2 * expectedPreview,
      1e-9,
    );
  });

  it("sums scores of all exercises", async () => {
    actionsFixture = [
      { id: 1, base: 2, rig: "BARBELL", isDurationBased: false },
      { id: 2, base: 1.5, rig: "BARBELL", isDurationBased: false },
    ];

    const result = await calculateTrainingScores(USER_ID, [
      makeExercise({
        id: 1,
        purpose: "MASS",
        approaches: [
          { weight: 60, count: 10 },
          { weight: 70, count: 8 },
        ],
      }),
      makeExercise({
        id: 2,
        purpose: "STRENGTH",
        approaches: [
          { weight: 100, count: 5 },
          { weight: 110, count: 3 },
        ],
      }),
    ]);

    // 3.5 × 2 + 5 × 2
    expect(result.timeScoreInMins).to.equal(17);
    expect(result.timeScoreInSecs).to.equal(1020);

    const massPreview =
      0.5 * Math.log(65) +
      0.25 * Math.log(9) +
      0.25 * Math.log(1160) +
      0.1 * Math.log(70);
    // STRENGTH: sum = 830, max = 110, countMean = 4
    const strengthPreview =
      0.5 * Math.log(110) + 0.5 * Math.log(830) - 0.5 * Math.log(4);

    expect(result.exercises[0].timeScoreInMins).to.equal(7);
    expect(result.exercises[1].timeScoreInMins).to.equal(10);
    expect(result.exercises[1].difficultyScore).to.be.closeTo(
      1.5 * strengthPreview,
      1e-9,
    );
    expect(result.difficultyScore).to.be.closeTo(
      2 * massPreview + 1.5 * strengthPreview,
      1e-9,
    );
  });

  it("keeps the order and duplicates of the given exercises", async () => {
    actionsFixture = [{ id: 1, base: 2, rig: "BARBELL", isDurationBased: false }];

    const result = await calculateTrainingScores(USER_ID, [
      makeExercise({ purpose: "MASS" }),
      makeExercise({ purpose: "STRENGTH" }),
    ]);

    expect(result.exercises.map((item) => item.purpose)).to.deep.equal([
      "MASS",
      "STRENGTH",
    ]);
    expect(result.timeScoreInMins).to.equal(3.5 + 5);
  });

  it("adds the latest user weight for bodyweight exercises", async () => {
    actionsFixture = [{ id: 1, base: 1, rig: "OTHER", isDurationBased: false }];

    const result = await calculateTrainingScores(USER_ID, [
      makeExercise({
        purpose: "LOSS",
        approaches: [
          { weight: 0, count: 10 },
          { weight: 0, count: 12 },
        ],
      }),
    ]);

    expect(weightFindFirstCalls).to.have.length(1);
    expect(weightFindFirstCalls[0].where).to.deep.equal({ userId: USER_ID });

    // собственный вес 80 кг: sum = 80×10 + 80×12, mean = 80, max = 80, countTotal = 22, countMean = 11
    const expectedPreview =
      0.5 * Math.log(22) + 0.5 * Math.log(11) + 0.5 * Math.log(80);
    expect(result.difficultyScore).to.be.closeTo(expectedPreview, 1e-9);
    // LOSS: 2 мин на подход × 2 подхода
    expect(result.timeScoreInMins).to.equal(4);
  });

  it("does not look up the user weight when there are no bodyweight exercises", async () => {
    actionsFixture = [{ id: 1, base: 2, rig: "DUMBBELL", isDurationBased: false }];

    await calculateTrainingScores(USER_ID, [makeExercise()]);

    expect(weightFindFirstCalls).to.have.length(0);
  });

  it("scores duration-based exercises as LOSS without the user weight", async () => {
    actionsFixture = [{ id: 1, base: 1, rig: "OTHER", isDurationBased: true }];

    const result = await calculateTrainingScores(USER_ID, [
      makeExercise({
        purpose: "MASS",
        approaches: [
          { weight: 5, count: 30 },
          { weight: 5, count: 30 },
        ],
      }),
    ]);

    expect(weightFindFirstCalls).to.have.length(0);
    expect(result.exercises[0].purpose).to.equal("LOSS");

    // длительность: countTotal = 60 с, countMean = 30 с, параметр max = mean = 5, sum = 5×30 + 5×30
    const expectedPreview =
      0.5 * Math.log(60) + 0.5 * Math.log(30) + 0.5 * Math.log(5);
    expect(result.difficultyScore).to.be.closeTo(expectedPreview, 1e-9);
    expect(result.timeScoreInMins).to.equal(4);
  });

  it("throws an input error listing unknown exercise ids", async () => {
    actionsFixture = [{ id: 1, base: 2, rig: "BARBELL", isDurationBased: false }];

    try {
      await calculateTrainingScores(USER_ID, [
        makeExercise({ id: 1 }),
        makeExercise({ id: 7 }),
        makeExercise({ id: 9 }),
      ]);
      expect.fail("expected MobileScoresInputError to be thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(MobileScoresInputError);
      expect((error as Error).message).to.equal("Unknown exercise ids: 7, 9");
    }
  });

  it("throws an input error when a bodyweight exercise has no user weight record", async () => {
    actionsFixture = [{ id: 1, base: 1, rig: "OTHER", isDurationBased: false }];
    (prisma.weight as any).findFirst = async (args: any) => {
      weightFindFirstCalls.push(args);
      return null;
    };

    try {
      await calculateTrainingScores(USER_ID, [makeExercise()]);
      expect.fail("expected MobileScoresInputError to be thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(MobileScoresInputError);
      expect((error as Error).message).to.equal(
        "User has no weight records required for bodyweight exercises",
      );
    }
  });
});
