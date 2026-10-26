import { assert } from "chai";
import { test } from "node:test";
import type { Purpose } from "@prisma/client";
import { calculateExerciseDifficulty } from "@/core/difficulty";
import {
  buildMuscleSignature,
  distributeExerciseLoad,
  executedExerciseDifficulty,
} from "@/core/muscleLoad";

const MASS = "MASS" as Purpose;

const back = { groupId: 1, sizeFactor: 1.0 };
const biceps = { groupId: 2, sizeFactor: 0.5 };

test("distributeExerciseLoad()", async (context) => {
  await context.test(
    "делит нагрузку между группами по размеру мышцы и роли",
    () => {
      // 1.0 * 0.7 = 0.7 у агониста, 0.5 * 0.3 = 0.15 у синергиста, всего 0.85
      const loads = distributeExerciseLoad({
        planned: 17,
        executed: 8.5,
        agony: [back],
        synergy: [biceps],
      });

      assert.lengthOf(loads, 2);
      assert.approximately(loads[0].planned, 14, 0.0001);
      assert.approximately(loads[1].planned, 3, 0.0001);
      assert.approximately(loads[0].executed, 7, 0.0001);
      assert.approximately(loads[1].executed, 1.5, 0.0001);
      assert.equal(loads[0].agonyCnt, 1);
      assert.equal(loads[1].synergyCnt, 1);
    },
  );

  await context.test(
    "сумма долей равна нагрузке упражнения — нить сходится с линией сложности",
    () => {
      const loads = distributeExerciseLoad({
        planned: 12.34,
        executed: 9.87,
        agony: [back, biceps],
        synergy: [{ groupId: 3, sizeFactor: 0.3 }],
      });

      assert.approximately(
        loads.reduce((sum, item) => sum + item.planned, 0),
        12.34,
        0.0001,
      );
      assert.approximately(
        loads.reduce((sum, item) => sum + item.executed, 0),
        9.87,
        0.0001,
      );
    },
  );

  await context.test(
    "группа, работавшая и агонистом и синергистом, получает обе доли",
    () => {
      const loads = distributeExerciseLoad({
        planned: 10,
        executed: 0,
        agony: [back],
        synergy: [{ ...back }],
      });

      assert.lengthOf(loads, 1);
      assert.equal(loads[0].groupId, back.groupId);
      assert.approximately(loads[0].planned, 10, 0.0001);
      assert.equal(loads[0].agonyCnt, 1);
      assert.equal(loads[0].synergyCnt, 1);
    },
  );

  await context.test("не делит нагрузку, если мышц нет", () => {
    assert.deepEqual(
      distributeExerciseLoad({ planned: 10, executed: 5, agony: [], synergy: [] }),
      [],
    );
  });

  await context.test(
    "не делит нагрузку, если размер мышц нулевой", () => {
      assert.deepEqual(
        distributeExerciseLoad({
          planned: 10,
          executed: 5,
          agony: [{ groupId: 1, sizeFactor: 0 }],
          synergy: [],
        }),
        [],
      );
    },
  );
});

test("executedExerciseDifficulty()", async (context) => {
  await context.test("возвращает 0, когда данных о выполнении нет", () => {
    const lifted = {
      liftedSum: 0,
      liftedMean: 0,
      liftedMax: 0,
      liftedCountTotal: 0,
      liftedCountMean: 0,
    };

    assert.equal(executedExerciseDifficulty(2.5, lifted, MASS), 0);
  });

  await context.test(
    "совпадает с плановой сложностью при равных плановых и выполненных подъёмах",
    () => {
      const group = { sum: 500, mean: 50, max: 100, countTotal: 10, countMean: 5 };
      const lifted = {
        liftedSum: group.sum,
        liftedMean: group.mean,
        liftedMax: group.max,
        liftedCountTotal: group.countTotal,
        liftedCountMean: group.countMean,
      };

      const planned = calculateExerciseDifficulty({
        action: { base: 2.5 },
        approachGroup: group,
        purpose: MASS,
      });

      assert.approximately(
        executedExerciseDifficulty(2.5, lifted, MASS),
        planned,
        0.0001,
      );
    },
  );
});

test("buildMuscleSignature()", async (context) => {
  await context.test("не зависит от порядка и дублей групп", () => {
    assert.equal(buildMuscleSignature([3, 1, 2]), buildMuscleSignature([2, 3, 1]));
    assert.equal(buildMuscleSignature([1, 1, 2]), buildMuscleSignature([1, 2]));
  });

  await context.test("разные наборы групп дают разные подписи", () => {
    assert.notEqual(buildMuscleSignature([1, 2]), buildMuscleSignature([1, 3]));
  });

  await context.test("без агонистов подписи нет", () => {
    assert.isNull(buildMuscleSignature([]));
  });
});
