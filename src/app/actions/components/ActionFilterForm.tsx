"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  groups: Array<{ id: number; title: string }>;
  initialGroupId: number | null;
  groupCounts?: Record<number, number>;
  allGroupsCount?: number;
};

export function ActionFilterForm({
  groups,
  initialGroupId,
  groupCounts = {},
  allGroupsCount = 0,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    </div>
  );
}
