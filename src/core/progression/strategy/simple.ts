import { SetData, SetDataExecuted } from "@/core/types";
import type { Action } from "@prisma/client";
import { assert } from "chai";

/**
 * Простейшая стратегия.
 *
 * На силовые:
 *   Цель - плавное повышения взятия веса на раз, с небольшим повышением mean.
 *   Последний подход всегда на 1 раз.
 *
 * На массу:
 *   Увеличиваем вес на минимальный шаг с сохранением кол-ва повторений елочкой.
 *   Последний подход всегда на меньший вес, но на 12, если задан MassAddDropSet.
 */

export type ProgressionStrategySimpleOpts = {
  StrengthWorkingSetsCount: number;
  StrengthPrepareSetsCount: number;
  MassSetsCount: number;
  MassAddDropSet: boolean;
  MassBigCountCoef: number;
};

const Defaults = {
  StrengthWorkingSetsCount: 4,
  StrengthPrepareSetsCount: 2,
  MassSetsCount: 4,
  MassAddDropSet: true,
  MassBigCountCoef: 1.8,
};

export class ProgressionStrategySimple {
  public readonly _opts: ProgressionStrategySimpleOpts;
  private _weightMassDelta: number;
  private _weightStrDelta: number;
  constructor(
    private _action: Pick<Action, "rig" | "strengthAllowed" | "bigCount">,
    opts?: ProgressionStrategySimpleOpts,
  ) {
    this._opts = opts ? Object.assign(Defaults, opts) : Defaults;
    this._weightMassDelta = 2.5;
    this._weightStrDelta = 5;
  }

  _upgradeStrengthWorkingSets(
    executedSets: SetData[],
    weightDelta: number,
  ): SetData[] {
    // will copy objects by value
    const setsCopy: SetData[] = [];

    for (const set of executedSets.slice(
      -this._opts.StrengthWorkingSetsCount,
    )) {
      if (set.count !== 0)
        setsCopy.push({ count: set.count, weight: set.weight });
    }
    if (setsCopy.length !== this._opts.StrengthWorkingSetsCount) {
      // какие-то подходы не удалось выполнить, надо перестроить нагрузку
      // берем последний успешный вес и выстраиваем новую пирамиду весов
      const setsRebuild: SetData[] = [];
      let lastSet = setsCopy[setsCopy.length - 1];
      setsRebuild.unshift({ weight: lastSet.weight, count: 1 });
      for (let i = 0; i < this._opts.StrengthWorkingSetsCount - 1; i++) {
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
    for (let i = 0; i < this._opts.StrengthPrepareSetsCount; i++) {
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
      this._weightStrDelta,
    );
    let preparing = this._upgradeStrengthPrepareSets(
      working,
      this._weightStrDelta,
    );
    return preparing.concat(working);
  }

  mass(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let sets: SetData[] = [];
    for (let i = 0; i < this._opts.MassSetsCount; i++) {
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
    ];
    if (this._action.bigCount) {
      for (const item of transitions) {
        item.above = Math.max(
          Math.floor(item.above * this._opts.MassBigCountCoef),
          30,
        );
        item.to = Math.max(
          Math.floor(item.to * this._opts.MassBigCountCoef),
          15,
        );
      }
    }

    for (let i = 0; i < sets.length; i++) {
      if (sets[i].count >= transitions[i].above) {
        sets[i] = {
          weight: sets[i].weight + this._weightMassDelta,
          count: transitions[i].to,
        };
      } else {
        sets[i].count += 1;
      }
    }

    if (this._opts.MassAddDropSet) {
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
    if (mean >= 16) {
      mean = 8;
      addSet = true;
    } else {
      mean += 4;
    }

    let sets: SetData[] = [];
    for (let i = 0; i < planned.length; i++) {
      sets.push({ count: mean, weight: planned[i].weight });
    }
    if (addSet) {
      sets.push({ count: mean, weight: executed[0].weight });
    }

    return sets;
  }
}
