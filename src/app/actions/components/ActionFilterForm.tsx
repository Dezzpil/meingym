"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  groups: Array<{ id: number; title: string }>;
  initialGroupId: number | null;
  initialStrengthAllowed: boolean | null;
  groupCounts?: Record<number, number>;
  allGroupsCount?: number;
  strengthAllowedCount?: number;
};

export function ActionFilterForm({
  groups,
  initialGroupId,
  initialStrengthAllowed,
  groupCounts = {},
  allGroupsCount = 0,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [strengthAllowed, setStrengthAllowed] = useState<boolean>(
    initialStrengthAllowed === true,
  );

  const buildQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  const handleStrengthAllowedChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = e.target.checked;
    setStrengthAllowed(checked);
    const newQuery = buildQueryString("strengthAllowed", checked ? "on" : "");
    router.push(`/actions?${newQuery}`);
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newQuery = buildQueryString("group", value);
    router.push(`/actions?${newQuery}`);
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      <div className="d-flex align-items-center gap-2">
        <select
          id="groupFilter"
          className="form-select"
          value={initialGroupId ?? ""}
          onChange={handleGroupChange}
        >
          <option value="">
            Все группы{allGroupsCount > 0 ? ` (${allGroupsCount})` : ""}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
              {groupCounts[g.id] > 0 ? ` (${groupCounts[g.id]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="form-check form-check-inline mb-0">
        <input
          type="checkbox"
          name="strengthAllowed"
          id="strengthAllowed"
          className="form-check-input"
          checked={strengthAllowed}
          onChange={handleStrengthAllowedChange}
        />
        <label className="form-check-label" htmlFor="strengthAllowed">
          Силовые?
        </label>
      </div>
    </div>
  );
}
