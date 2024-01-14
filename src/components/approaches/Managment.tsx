"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Loader from "@/components/Loader";
import { ApproachLiftData } from "@/app/approaches/types";
import { ApproachesManagementElement } from "@/components/approaches/ManagmentElement";
import { TbSum } from "react-icons/tb";
import { handleUpdateApproachesGroup } from "@/app/approaches/actions";
import type { Approach } from "@prisma/client";

type Props = {
  groupId: number;
  approaches: Approach[];
};

export function ApproachesManagement({ groupId, approaches }: Props) {
  const [preprocessed, setPreprocessed] = useState<boolean>(false);
  const [data, setData] = useState<ApproachLiftData[]>([]);
  const [sum, setSum] = useState<number>(0);

  useMemo(() => {
    const data: ApproachLiftData[] = [];
    approaches.map((a) => {
      data.push({
        count: a.count,
        weight: a.weight,
        priority: a.priority,
      });
    });
    setData(data);
    setPreprocessed(true);
  }, [approaches]);

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
        priority: last.priority ? last.priority + 1 : 0,
      };
    }
    setData((data) => {
      const newData = [...data];
      newData.push(newOne);
      return newData;
    });
    recalculate();
  }, [data, recalculate]);

  const remove = useCallback(
    (e: MouseEvent) => {
      const button = e.target as HTMLButtonElement;
      const key = button.getAttribute("data-key");
      setData((data) => {
        const newData: ApproachLiftData[] = [];
        for (const item of data) {
          if (item.priority === parseInt(key + "")) continue;
          newData.push(item);
        }
        return newData;
      });
      recalculate();
    },
    [recalculate],
  );

  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setHandling(true);
      try {
        await handleUpdateApproachesGroup(groupId, data);
      } catch (e: any) {
        setError(e.message);
      }
      setHandling(false);
    },
    [data, groupId],
  );

  return !preprocessed ? (
    <Loader />
  ) : (
    <>
      {data && (
        <form className="row" onSubmit={submit}>
          <ol style={{ paddingLeft: "32px" }}>
            {data.map((d) => (
              <li
                key={d.priority}
                className="col-12 mb-3"
                style={{ paddingLeft: "8px" }}
              >
                <ApproachesManagementElement
                  elem={d}
                  onChange={recalculate}
                  onRemove={remove}
                />
              </li>
            ))}
          </ol>
          <div className="mb-2 d-flex gap-3 align-items-center">
            <div className="d-inline-flex align-items-center">
              <TbSum />: {sum}
            </div>
            <button className="btn btn-success" disabled={handling}>
              Сохранить
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => add()}
            >
              Добавить подход
            </button>
          </div>
          {error && <div className="mb-2 alert alert-danger">{error}</div>}
        </form>
      )}
    </>
  );
}
