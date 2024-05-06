import { SetData, SetDataExecuted } from "@/core/types";
import type { Action, Rig } from "@prisma/client";
import { assert } from "chai";
import { ActionRig } from "@prisma/client";

/**
 * Простейшая стратегия.
 *
 * На силовые:
 *   Цель - плавное повышения взятия веса на раз, с небольшим повышением mean.
 *   Последний подход всегда на 1 раз.
 *
 * На массу:
 *   Увеличиваем вес на минимальный шаг с сохранением кол-ва повторений елочкой.
 *   Последний подход всегда на меньший вес, но на 12.
 */

export type ProgressionStrategySimpleOpts = {
  StrengthWorkingSetsCount: number;
  StrengthPrepareSetsCount: number;
  MassSetsCount: number;
};

const Defaults = {
  StrengthWorkingSetsCount: 4,
  StrengthPrepareSetsCount: 2,
  MassSetsCount: 4,
};

export class ProgressionStrategySimple {
  public readonly opts: ProgressionStrategySimpleOpts;
  private readonly _rig: Rig;
  constructor(
    rigs: Rig[],
    private _action: Pick<Action, "rig" | "strengthAllowed">,
    opts?: ProgressionStrategySimpleOpts,
  ) {
    this.opts = opts ? Object.assign(Defaults, opts) : Defaults;
    this._rig = rigs.filter((rig) => _action.rig === rig.code)[0];
    assert.isNotEmpty(this._rig);
  }

  _upgradeStrengthWorkingSets(
    executedSets: SetData[],
    weightDelta: number,
  ): SetData[] {
    assert.isAbove(executedSets.length, this.opts.StrengthWorkingSetsCount - 1);

    // will copy objects by value
    const setsCopy: SetData[] = [];

    for (const set of executedSets.slice(-this.opts.StrengthWorkingSetsCount)) {
      if (set.count !== 0) setsCopy.push(JSON.parse(JSON.stringify(set)));
    }
    if (setsCopy.length !== this.opts.StrengthWorkingSetsCount) {
      // какие-то подходы не удалось выполнить, надо перестроить нагрузку
      // берем последний успешный вес и выстраиваем новую пирамиду весов
      const setsRebuild: SetData[] = [];
      let lastSet = setsCopy[setsCopy.length - 1];
      setsRebuild.unshift({ weight: lastSet.weight, count: 1 });
      for (let i = 0; i < this.opts.StrengthWorkingSetsCount - 1; i++) {
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
    for (let i = 0; i < this.opts.StrengthPrepareSetsCount; i++) {
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
    let weightDelta = 5;
    if (this._rig.code === ActionRig.BARBELL) weightDelta = this._rig.value * 2;
    let working = this._upgradeStrengthWorkingSets(executed, weightDelta);
    let preparing = this._upgradeStrengthPrepareSets(working, weightDelta);
    return preparing.concat(working);
  }

  mass(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let sets: SetData[] = [];
    for (let i = 0; i < this.opts.MassSetsCount; i++) {
      if (executed[i]) {
        const set = JSON.parse(JSON.stringify(executed[i])) as SetData;
        sets.push(set);
      } else {
        sets.unshift(JSON.parse(JSON.stringify(executed[0])));
      }
    }

    let weightDelta = 2.5;

    const upgrades = [
      { above: 14, to: 12 },
      { above: 12, to: 10 },
      { above: 10, to: 8 },
      { above: 14, to: 12 },
    ];

    for (let i = 0; i < sets.length; i++) {
      if (sets[i].count >= upgrades[i].above) {
        sets[i] = {
          weight: sets[i].weight + weightDelta,
          count: upgrades[i].to,
        };
      } else {
        sets[i].count += 1;
      }
    }

    sets[3].weight = sets[0].weight;

    return sets;
  }
}
