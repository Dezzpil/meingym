"use client";

import React, { ChangeEvent, useCallback } from "react";
import { GiWeight } from "react-icons/gi";
import { TiDeleteOutline } from "react-icons/ti";
import { ApproachData } from "@/core/approaches";

type Props = {
  elem: ApproachData;
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
      elem.weight = parseFloat(value) || 0;
      onChange();
    },
    [elem, onChange],
  );
  const onChangeCounts = useCallback(
    (e: ChangeEvent) => {
      const value = (e.nativeEvent.target as HTMLInputElement).value;
      elem.count = parseInt(value) || 0;
      onChange();
    },
    [elem, onChange],
  );
  const remove = useCallback(() => {
    onRemove(elem.priority);
  }, [elem.priority, onRemove]);
  return (
    <>
      <div className="d-flex gap-2">
        <div className="input-group">
          <span className="input-group-text">
            <GiWeight />
          </span>
          <input
            type="number"
            min={0}
            step={0.5}
            className="form-control"
            defaultValue={elem.weight}
            id={`weight${elem.priority}`}
            onChange={onChangeWeight}
          />
          <span className="input-group-text">x</span>
          <input
            type="number"
            min={1}
            className="form-control"
            defaultValue={elem.count}
            id={`counts${elem.priority}`}
            onChange={onChangeCounts}
          />
        </div>
        <button
          className="btn btn-dark"
          type="button"
          data-key={elem.priority}
          onClick={remove}
        >
          <TiDeleteOutline />
        </button>
      </div>
    </>
  );
}
