"use client";

import { ApproachLiftData } from "@/app/approaches/types";
import { ChangeEvent, useCallback } from "react";

type Props = {
  elem: ApproachLiftData;
  onChange: CallableFunction;
  onRemove: CallableFunction;
};
export function ApproachesManagementElement({
  elem,
  onChange,
  onRemove,
}: Props) {
  const onChangeWeight = useCallback(
    (e: ChangeEvent) => {
      const value = (e.nativeEvent.target as HTMLInputElement).value;
      elem.weight = parseInt(value) || 0;
      onChange();
    },
    [elem, onChange],
  );
  const onChangeCounts = useCallback(
    (e: ChangeEvent) => {
      const value = (e.nativeEvent.target as HTMLInputElement).value;
      elem.countsPlanned = parseInt(value) || 0;
      onChange();
    },
    [elem, onChange],
  );
  return (
    <>
      <div className="col-sm-12 col-md-6 col-lg-5 col-xl-4 d-flex gap-2">
        <div className="row row-cols-3">
          <div className="col-5 form-floating">
            <input
              type="number"
              min={0}
              className="form-control"
              defaultValue={elem.weight}
              id={`weight${elem.priority}`}
              onChange={onChangeWeight}
            />
            <label htmlFor={`weight${elem.priority}`}>Вес, кг</label>
          </div>
          <div className="col-5 form-floating">
            <input
              type="number"
              min={1}
              className="form-control"
              defaultValue={elem.countsPlanned}
              id={`counts${elem.priority}`}
              onChange={onChangeCounts}
            />
            <label htmlFor={`counts${elem.priority}`}>Повторы</label>
          </div>
          <button
            className="btn col-2"
            type="button"
            data-key={elem.priority}
            onClick={(e) => onRemove(e)}
          >
            X
          </button>
        </div>
      </div>
    </>
  );
}
