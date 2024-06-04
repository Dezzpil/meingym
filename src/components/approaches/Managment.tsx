"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Loader from "@/components/Loader";
import { ApproachesManagementElement } from "@/components/approaches/ManagmentElement";
import { TbSum } from "react-icons/tb";
import {
  handleCreateNewApproachesGroup,
  handleUpdateApproachGroup,
} from "@/app/approaches/actions";
import type { Approach, Purpose } from "@prisma/client";
import { ApproachData } from "@/core/approaches";

type Props = {
  create?: {
    purpose: Purpose;
    actionPurposeId: number;
  };
  update?: {
    groupId: number;
    trainingId: number;
  };
  approaches: Approach[];
  actionId: number;
};

export function ApproachesManagement({
  create,
  update,
  approaches,
  actionId,
}: Props) {
  const currentData = useMemo(() => {
    const data: ApproachData[] = [];
    approaches.map((a) => {
      data.push({
        count: a.count,
        weight: a.weight,
        priority: a.priority,
      });
    });
    return data;
  }, [approaches]);
  const currentSum = useMemo(() => {
    let curSum = 0;
    currentData.forEach((d) => {
      curSum += d.count * d.weight;
    });
    return curSum;
  }, [currentData]);

  const [data, setData] = useState<ApproachData[]>(currentData);
  const [sum, setSum] = useState<number>(currentSum);

  const recalculate = useCallback(() => {
    let curSum = 0;
    data.forEach((d) => {
      curSum += d.count * d.weight;
    });
    setSum(curSum);
  }, [data]);

  const add = useCallback(() => {
    const last = data.length > 0 ? data[data.length - 1] : null;
    let newOne = { count: 1, weight: 0, priority: 0 };
    if (last) {
      newOne = {
        count: Math.max(last.count - 4, 1),
        weight: last.weight + 5,
        priority: last.priority + 1,
      };
    }
    data.push(newOne);
    setData(data);
    setSum((sum) => sum + newOne.weight * newOne.count);
  }, [data]);

  const remove = useCallback(
    (priority: number) => {
      let removedItem: ApproachData | null = null;
      const newData: ApproachData[] = [];
      for (const item of data) {
        if (item.priority === priority) {
          removedItem = item;
          continue;
        }
        newData.push(item);
      }
      setData(newData);
      if (removedItem) {
        // @ts-ignore
        setSum((sum) => sum - removedItem?.count * removedItem?.weight);
      }
    },
    [data],
  );

  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setHandling(true);
      try {
        if (create) {
          await handleCreateNewApproachesGroup(
            create.purpose,
            create.actionPurposeId,
            data,
            actionId,
          );
        }
        if (update) {
          await handleUpdateApproachGroup(
            update.groupId,
            data,
            update.trainingId,
          );
        }
      } catch (e: any) {
        setError(e.message);
      }
      setHandling(false);
    },
    [create, data, update],
  );

  return !data ? (
    <Loader />
  ) : (
    <>
      {data && (
        <form onSubmit={submit}>
          <div>
            {data.map((d) => (
              <div key={d.priority} className="col-12 mb-3">
                <ApproachesManagementElement
                  elem={d}
                  onChange={recalculate}
                  onRemove={remove}
                />
              </div>
            ))}
          </div>
          <div className="mb-2 d-flex gap-3 align-items-center">
            <div className="d-inline-flex align-items-center">
              <TbSum />: {sum}
            </div>
            <button className="btn btn-primary" disabled={handling}>
              Сохранить
            </button>
            <button type="button" className="btn btn-light" onClick={add}>
              Добавить подход
            </button>
          </div>
          {error && <div className="mb-2 alert alert-danger">{error}</div>}
        </form>
      )}
    </>
  );
}
