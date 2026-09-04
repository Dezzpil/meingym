import { SetData, SetDataExecuted } from "@/core/types";
import type { Action } from "@prisma/client";
import { assert } from "chai";
import { sort } from "next/dist/build/webpack/loaders/css-loader/src/utils";

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
  // упражнения «на длительность» (isDurationBased): секунды в count, параметр в weight
  durationSetsCount: number;
  durationStepSec: number;
  durationMaxSec: number;
  durationParamStep: number;
  durationMaxSets: number;
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
    durationSetsCount: 1,
    durationStepSec: 30,
    durationMaxSec: 600,
    durationParamStep: 1,
    durationMaxSets: 5,
  };

export class ProgressionStrategySimple {
  public readonly _opts: ProgressionStrategySimpleOptsType;
  constructor(
    private _action: Pick<
      Action,
      | "rig"
      | "bigCount"
      | "oneDumbbell"
      | "isDurationBased"
      | "durationParamLabel"
    >,
    opts?: ProgressionStrategySimpleOptsType | null,
  ) {
    this._opts = opts
      ? Object.assign(ProgressionStrategySimpleOptsDefaults, opts)
      : ProgressionStrategySimpleOptsDefaults;
  }

  _upgradeStrengthWorkingSets(
    executedSets: SetData[],
    opts?: ProgressionStrategySimpleOptsType,
  ): SetData[] {
    opts = opts || this._opts;

    // take only opts.strengthWorkingSetsCount weight with sum of counts!
    const sortedSetsMap: Record<string, number> = {}; // weight, count
    for (const set of executedSets.toSorted((a, b) => {
      return a.weight > b.weight ? -1 : 1;
    })) {
      if (set.count === 0) continue;

      if (!(set.weight in sortedSetsMap)) {
        if (Object.keys(sortedSetsMap).length >= opts.strengthWorkingSetsCount)
          break;
        sortedSetsMap[set.weight] = 0;
      }
      sortedSetsMap[set.weight] += set.count;
    }

    console.log("sortedSetsMap", sortedSetsMap);

    // will copy objects by value
    const setsCopy: SetData[] = [];

    const sortedSets = Object.entries(sortedSetsMap)
      .map((entry) => {
        return { weight: +entry[0], count: +entry[1] };
      })
      .toSorted((a, b) => {
        return a.weight > b.weight ? -1 : 1;
      });

    const bestSet = sortedSets[0];
    let maxWeight = bestSet.weight;
    let rebuildLadder = false;
    if (bestSet.count >= 3) {
      // TODO вынести в параметры цифру 3
      maxWeight += opts.strengthWeightDelta;
      rebuildLadder = true;
    }

    if (rebuildLadder) {
      for (let i = 0; i < opts.strengthWorkingSetsCount; i++) {
        setsCopy.unshift({ weight: maxWeight, count: 1 });
        maxWeight -= opts.strengthWeightDelta;
      }
    } else {
      // выравниваем лестницу
      let increaseNext = true;
      for (let i = opts.strengthWorkingSetsCount - 1; i >= 0; i--) {
        const set = sortedSets[i];
        if (!set) continue;
        // console.log("set", set);
        if (set.count >= 3) {
          set.count = 3;
          setsCopy.push({ weight: set.weight, count: set.count });
          increaseNext = true;
          continue;
        }

        if (increaseNext) {
          increaseNext = false;
          set.count += 1;
        }

        setsCopy.push({ weight: set.weight, count: set.count });
      }
    }

    // let decreasedMaxWeight = maxWeight - opts.strengthWeightDelta;
    // for (let i = 0; i < opts.strengthWorkingSetsCount - 1; i++) {
    //   if (rebuildLadder) {
    //     setsCopy.unshift({ weight: decreasedMaxWeight, count: i + 1 });
    //   } else {
    //     const prevWeightSet = sortedSets[i + 1];
    //     if (prevWeightSet.weight === decreasedMaxWeight) {
    //       setsCopy.unshift({
    //         weight: decreasedMaxWeight,
    //         count: prevWeightSet.count + 1,
    //       });
    //     } else {
    //       setsCopy.unshift({
    //         weight: decreasedMaxWeight,
    //         count: i + 1,
    //       });
    //     }
    //   }
    //   decreasedMaxWeight -= opts.strengthWeightDelta;
    // }

    // for (const set of executedSets.slice(-opts.strengthWorkingSetsCount)) {
    //   if (set.count !== 0)
    //     setsCopy.push({ count: set.count, weight: set.weight });
    // }
    //
    // if (setsCopy.length !== opts.strengthWorkingSetsCount) {
    //   // какие-то подходы не удалось выполнить, надо перестроить нагрузку
    //   // берем последний успешный вес и выстраиваем новую пирамиду весов
    //   const setsRebuild: SetData[] = [];
    //   let lastSet = setsCopy[setsCopy.length - 1];
    //   setsRebuild.unshift({ weight: lastSet.weight, count: 1 });
    //   for (let i = 0; i < opts.strengthWorkingSetsCount - 1; i++) {
    //     lastSet = {
    //       weight: lastSet.weight - opts.strengthWeightDelta,
    //       count: 1 + i,
    //     };
    //     setsRebuild.unshift(lastSet);
    //   }
    //   return setsRebuild;
    // }
    //
    // // последние подходы были выполнены успешно, увеличиваем нагрузку
    //
    // const maxRep = setsCopy.length;
    //
    // let upCounts = false;
    // for (let i = 0; i < setsCopy.length - 1; i++) {
    //   if (setsCopy[i].count < maxRep - i) {
    //     setsCopy[i].count += 1;
    //     upCounts = true;
    //     break;
    //   }
    // }
    //
    // if (!upCounts) {
    //   for (let i = 0; i <= setsCopy.length - 1; i++) {
    //     setsCopy[i].weight += opts.strengthWeightDelta;
    //     setsCopy[i].count = Math.max(setsCopy.length - i - 1, 1);
    //   }
    // }

    return setsCopy;
  }

  _getMinWeightByRig() {
    switch (this._action.rig) {
      case "BARBELL":
        return 10;
      case "BLOCKS":
        return 5;
      case "DUMBBELL":
        return 2.5;
      case "KETTLEBELL":
        return 2;
      case "OTHER":
        return 0;
    }
    return 0;
  }

  _upgradeStrengthPrepareSets(
    workingSets: SetData[],
    opts?: ProgressionStrategySimpleOptsType,
  ): SetData[] {
    opts = opts || this._opts;
    const sets: SetData[] = [];
    let set = workingSets[0];
    let count = set.count;
    for (let i = 0; i < opts.strengthPrepareSetsCount; i++) {
      count = Math.min(count + 2, 12);

      let weight = set.weight - opts.strengthWeightDelta * 2 * (i + 1);
      if (weight <= this._getMinWeightByRig()) {
        sets.unshift({ weight: this._getMinWeightByRig(), count });
        break;
      }

      sets.unshift({ weight, count });
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

    let working = this._upgradeStrengthWorkingSets(executed);
    let preparing = this._upgradeStrengthPrepareSets(working);
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
        sets[i].count =
          sets[i].count % 2 === 0 ? sets[i].count : sets[i].count + 1;
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
      // TODO надо вынести это 2 в параметры нагрузки!
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

  /**
   * Прогрессия для упражнений «на длительность» (isDurationBased).
   * count = секунды, weight = параметр сложности (0 если параметра нет).
   *
   * Логика «сначала время, потом параметр»:
   *  - растим среднее время на durationStepSec, пока не достигнем durationMaxSec;
   *  - по достижении потолка сбрасываем время и повышаем сложность:
   *    при наличии параметра увеличиваем его на durationParamStep,
   *    иначе добавляем ещё один подход (не превышая durationMaxSets).
   */
  duration(planned: SetData[], executed: SetDataExecuted[]): SetData[] {
    assert.isAbove(executed.length, 0);

    let totalSec = 0;
    let param = 0;
    for (const set of executed) {
      totalSec += set.count;
      param = Math.max(param, set.weight);
    }
    let sec = Math.floor(totalSec / executed.length);

    const hasParam = this._action.durationParamLabel != null;
    let addSet = false;
    if (sec >= this._opts.durationMaxSec) {
      sec = this._opts.durationMaxSec - 2 * this._opts.durationStepSec;
      if (hasParam) {
        param += this._opts.durationParamStep;
      } else {
        addSet = true;
      }
    } else {
      sec += this._opts.durationStepSec;
    }

    const setsCount =
      planned.length > 0 ? planned.length : this._opts.durationSetsCount;
    const sets: SetData[] = [];
    for (let i = 0; i < setsCount; i++) {
      sets.push({ count: sec, weight: param });
    }
    if (addSet && sets.length < this._opts.durationMaxSets) {
      sets.push({ count: sec, weight: param });
    }

    return sets;
  }
}
