"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Loader from "@/components/Loader";
import { ApproachesManagementElement } from "@/components/approaches/ManagmentElement";
import {
  handleCreateNewApproachesGroup,
  handleUpdateApproachGroup,
} from "@/app/approaches/actions";
import type { Approach, ApproachesGroup, Purpose } from "@prisma/client";
import { ApproachData } from "@/core/approaches";
import { SetsStatsForApproachGroup } from "@/components/SetsStats";

type Props = {
  create?: {
    purpose: Purpose;
    actionPurposeId: number;
  };
  update?: {
    groupId: number;
    trainingId: number;
  };
  actionId: number;
  approachGroup: ApproachesGroup & { Approaches: Approach[] };
};

export function ApproachesManagement({
  create,
  update,
  actionId,
  approachGroup,
}: Props) {
  const currentData = useMemo(() => {
    const data: ApproachData[] = [];
    approachGroup.Approaches.map((a) => {
      data.push({
        count: a.count,
        weight: a.weight,
        priority: a.priority,
      });
    });
    return data;
  }, [approachGroup.Approaches]);

  const [data, setData] = useState<ApproachData[]>(currentData);

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
    const newData = [];
    for (const item of data) {
      newData.push(item);
    }
    setData(newData);
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
                  onChange={() => {}}
                  onRemove={remove}
                />
              </div>
            ))}
          </div>
          <div className="row mb-2">
            <SetsStatsForApproachGroup
              group={approachGroup}
              className="col-lg-6 col-md-12"
            />
            <div className="col-lg-6 col-md-12 d-flex gap-3 justify-content-end">
              <button className="btn btn-primary" disabled={handling}>
                Сохранить
              </button>
              <button type="button" className="btn btn-light" onClick={add}>
                Добавить подход
              </button>
            </div>
          </div>
          {error && <div className="mb-2 alert alert-danger">{error}</div>}
        </form>
      )}
    </>
  );
}
