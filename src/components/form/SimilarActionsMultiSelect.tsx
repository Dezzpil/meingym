"use client";

import React, { useMemo } from "react";
import Select from "react-select";
import { Controller, Control, FieldPath } from "react-hook-form";
import type { ActionsFormFieldsType } from "@/app/actions/types";

export type SimilarActionOption = { id: number; title: string };

type Props<Name extends FieldPath<ActionsFormFieldsType>> = {
  name: Name;
  label: string;
  options: SimilarActionOption[];
  control: Control<ActionsFormFieldsType>;
  isDisabled?: boolean;
  placeholder?: string;
};

export const SimilarActionsMultiSelect: React.FC<Props<any>> = ({
  name,
  label,
  options,
  control,
  isDisabled,
  placeholder,
}) => {
  const selectOptions = useMemo(
    () => options.map((o) => ({ value: String(o.id), label: o.title })),
    [options],
  );

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const valueArray: string[] = Array.isArray(field.value)
            ? (field.value as string[])
            : [];

          const selected = valueArray
            .map((v) => ({ value: v, label: v }))
            .map((opt) => selectOptions.find((o) => o.value === opt.value) || opt);

          return (
            <Select
              isMulti
              isClearable={false}
              options={selectOptions as any}
              value={selected as any}
              onChange={(vals) => {
                const next = Array.isArray(vals)
                  ? vals.map((v: any) => String(v.value))
                  : [];
                field.onChange(next);
              }}
              onBlur={field.onBlur}
              placeholder={placeholder ?? "Выберите упражнения..."}
              isDisabled={isDisabled}
              classNamePrefix="react-select"
            />
          );
        }}
      />
      <small className="form-text text-muted">
        Выберите упражнения, которые являются аналогами данного упражнения (те же
        движения, но с другим оборудованием). Показаны только упражнения с общими
        мышечными группами.
      </small>
    </div>
  );
};
