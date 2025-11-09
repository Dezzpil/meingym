"use client";

import React, { useMemo } from "react";
import Select from "react-select";
import { Controller, Control, FieldPath } from "react-hook-form";
import type { ActionsFormFieldsType } from "@/app/actions/types";
import type { Muscle } from "@prisma/client";

export type MuscleWithGroup = Muscle & { Group: { title: string } };

type Props<Name extends FieldPath<ActionsFormFieldsType>> = {
  name: Name;
  label: string;
  muscles: MuscleWithGroup[];
  control: Control<ActionsFormFieldsType>;
  isDisabled?: boolean;
  placeholder?: string;
};

export const MuscleMultiSelect: React.FC<Props<any>> = ({
  name,
  label,
  muscles,
  control,
  isDisabled,
  placeholder,
}) => {
  const groupedOptions = useMemo(() => {
    const groups: Record<string, { value: string; label: string }[]> = {};
    for (const m of muscles) {
      const key = m.Group?.title ?? "";
      if (!groups[key]) groups[key] = [];
      groups[key].push({ value: String(m.id), label: `${m.title}` });
    }

    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([groupTitle, options]) => ({ label: groupTitle, options }));
  }, [muscles]);

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // field.value expected to be string[] | undefined
          const valueArray: string[] = Array.isArray(field.value)
            ? (field.value as string[])
            : [];
          const selected = valueArray
            .map((v) => ({ value: v, label: v }))
            .map((opt) => {
              // find proper label from options list (by value)
              for (const group of groupedOptions) {
                const found = group.options.find((o) => o.value === opt.value);
                if (found) return found;
              }
              return opt;
            });

          return (
            <Select
              isMulti
              isClearable={false}
              options={groupedOptions as any}
              value={selected as any}
              onChange={(vals) => {
                const next = Array.isArray(vals)
                  ? vals.map((v: any) => String(v.value))
                  : [];
                field.onChange(next);
              }}
              onBlur={field.onBlur}
              placeholder={placeholder ?? "Имя мышцы..."}
              isDisabled={isDisabled}
              classNamePrefix="react-select"
            />
          );
        }}
      />
    </div>
  );
};
