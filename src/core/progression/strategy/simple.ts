import { SetData, SetDataExecuted } from "@/core/types";
import type { Action } from "@prisma/client";
import { assert } from "chai";

/**
 * Простейшая стратегия.
 *
 * @todo согласовать с ScoreCoefficients
 *
 * На силовые:
 *   Плавное повышения взятия веса на раз, с небольшим повышением тонажа.
 *   Последний подход всегда на 1 раз.
 *   Штрафуем за увеличение среднего количества повторений
 *
 * На массу:
 *   Увеличиваем вес на минимальный шаг с сохранением кол-ва повторений елочкой.
 *   Если задан MassAddDropSet, то добавляется последний подход всегда на меньший вес, но на 12 раз
 *
 * На снижение веса:
 *   Увеличение количества с постепенным повышением максимального веса
 */

export type ProgressionStrategySimpleOptsType = {
  strengthWorkingSetsCount: number;
  strengthPrepareSetsCount: number;
  strengthWeightDelta: number;
  massSetsCount: number;
  massAddDropSet: boolean;
  massBigCountCoef: number;
  massWeightDelta: number;
  lossCountStep: number;
  lossCountMax: number;
  lossWeightDelta: number;
  lossMaxSets: number;
};

export const ProgressionStrategySimpleOptsDefaults: ProgressionStrategySimpleOptsType =
  {
    strengthWorkingSetsCount: 4,
    strengthPrepareSetsCount: 2,
    strengthWeightDelta: 5,
    massSetsCount: 4,
    massAddDropSet: true,
    massBigCountCoef: 1.8,
    massWeightDelta: 2.5,
    lossCountStep: 4,
    lossCountMax: 16,
    lossWeightDelta: 1.25,
    lossMaxSets: 6,
  };

export class ProgressionStrategySimple {
  public readonly _opts: ProgressionStrategySimpleOptsType;
  constructor(
    private _action: Pick<Action, "rig" | "strengthAllowed" | "bigCount" | "oneDumbbell">,
    opts?: ProgressionStrategySimpleOptsType | null,
  ) {
    this._opts = opts
      ? Object.assign(ProgressionStrategySimpleOptsDefaults, opts)
      : ProgressionStrategySimpleOptsDefaults;
  }

  _upgradeStrengthWorkingSets(
    executedSets: SetData[],
    weightDelta: number,
  ): SetData[] {
    // will copy objects by value
    const setsCopy: SetData[] = [];

    for (const set of executedSets.slice(
      -this._opts.strengthWorkingSetsCount,
    )) {
      if (set.count !== 0)
        setsCopy.push({ count: set.count, weight: set.weight });
    }
    if (setsCopy.length !== this._opts.strengthWorkingSetsCount) {
      // какие-то подходы не удалось выполнить, надо перестроить нагрузку
      // берем последний успешный вес и выстраиваем новую пирамиду весов
      const setsRebuild: SetData[] = [];
      let lastSet = setsCopy[setsCopy.length - 1];
      setsRebuild.unshift({ weight: lastSet.weight, count: 1 });
      for (let i = 0; i < this._opts.strengthWorkingSetsCount - 1; i++) {
        lastSet = {
          weight: lastSet.weight - weightDelta,
          count: 1 + i,
        };
        setsRebuild.unshift(lastSet);
      }
      return setsRebuild;
    }

    // последние подходы были выполнены успешно, увеличиваем нагрузку

    const maxRep = setsCopy.length;

    let upCounts = false;
    for (let i = 0; i < setsCopy.length - 1; i++) {
      if (setsCopy[i].count < maxRep - i) {
        setsCopy[i].count += 1;
        upCounts = true;
        break;
      }
    }

    if (!upCounts) {
      for (let i = 0; i <= setsCopy.length - 1; i++) {
        setsCopy[i].weight += weightDelta;
        setsCopy[i].count = Math.max(setsCopy.length - i - 1, 1);
      }
    }

    return setsCopy;
  }

  _upgradeStrengthPrepareSets(
    workingSets: SetData[],
    weightDelta: number,
  ): SetData[] {
    const sets: SetData[] = [];
    let set = workingSets[0];
    for (let i = 0; i < this._opts.strengthPrepareSetsCount; i++) {
      set = {
        weight: set.weight - weightDelta * 2,
        count: Math.min(set.count * 2, 12),
      };
      sets.unshift(set);
    }
    return sets;
  }

  /**
   *
   * @param planned
   * @param executed
   */
  strength(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let working = this._upgradeStrengthWorkingSets(
      executed,
      this._opts.strengthWeightDelta,
    );
    let preparing = this._upgradeStrengthPrepareSets(
      working,
      this._opts.strengthWeightDelta * 2,
    );
    let sets = preparing.concat(working);
    if (this._action.oneDumbbell) {
      sets = sets.map((s) => ({
        weight: s.weight,
        count: s.count % 2 === 0 ? s.count : s.count + 1,
      }));
    }
    return sets;
  }

  mass(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let sets: SetData[] = [];
    for (let i = 0; i < this._opts.massSetsCount; i++) {
      if (executed[i]) {
        const set = {
          count: executed[i].count,
          weight: executed[i].weight,
        } as SetData;
        sets.push(set);
      } else {
        sets.unshift({
          count: executed[0].count,
          weight: executed[0].weight,
        } as SetData);
      }
    }

    let transitions = [
      { above: 15, to: 14 },
      { above: 13, to: 12 },
      { above: 11, to: 10 },
      { above: 9, to: 8 },
      { above: 7, to: 6 },
    ];
    if (this._action.bigCount) {
      for (const item of transitions) {
        item.above = Math.max(
          Math.floor(item.above * this._opts.massBigCountCoef),
          30,
        );
        item.to = Math.max(
          Math.floor(item.to * this._opts.massBigCountCoef),
          15,
        );
      }
    }

    for (let i = 0; i < sets.length; i++) {
      if (sets[i].count >= transitions[i].above) {
        sets[i] = {
          weight: sets[i].weight + this._opts.massWeightDelta,
          count: transitions[i].to,
        };
      } else {
        sets[i].count += 1;
      }
      if (this._action.oneDumbbell) {
        sets[i].count = sets[i].count % 2 === 0 ? sets[i].count : sets[i].count + 1;
      }
    }

    if (this._opts.massAddDropSet) {
      const dropSet: SetData = {
        count: sets[sets.length - 1].count,
        weight: sets[0].weight,
      };
      sets.push(dropSet);
    }

    return sets;
  }

  loss(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let cnt = 0;
    for (let i = 0; i < executed.length; i++) {
      cnt += executed[i].count;
    }
    let addSet = false;
    let mean = Math.floor(cnt / executed.length);
    if (mean >= this._opts.lossCountMax) {
      mean = this._opts.lossCountMax - 2 * this._opts.lossCountStep;
      addSet = true;
    } else {
      mean += this._opts.lossCountStep;
    }

    if (this._action.oneDumbbell) {
      mean = mean % 2 === 0 ? mean : mean + 1;
    }

    let sets: SetData[] = [];
    for (let i = 0; i < planned.length; i++) {
      sets.push({ count: mean, weight: executed[0].weight });
    }
    if (addSet) {
      sets.push({ count: mean, weight: executed[0].weight });
    }

    if (sets.length > this._opts.lossMaxSets) {
      sets = [];
      for (let i = 0; i < this._opts.lossMaxSets - 2; i++) {
        sets.push({
          count: mean,
          weight: executed[0].weight + this._opts.lossWeightDelta,
        });
      }
    }

    return sets;
  }
}
