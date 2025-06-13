"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";

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
  strengthAllowedCount = 0,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [strengthAllowed, setStrengthAllowed] = useState<boolean>(
    initialStrengthAllowed === true,
  );

  const createQueryString = useCallback(
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

    // Update URL with the new strengthAllowed value
    const newQuery = createQueryString("strengthAllowed", checked ? "on" : "");
    router.push(`/actions?${newQuery}`);
  };

  // Create query string for group links
  const getGroupQueryString = (groupId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (groupId) {
      params.set("group", groupId.toString());
    } else {
      params.delete("group");
    }
    return params.toString();
  };

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="d-flex flex-wrap gap-2">
          <Link
            href={`/actions?${getGroupQueryString(null)}`}
            className={`btn btn-sm ${
              initialGroupId === null ? "btn-primary" : "btn-outline-secondary"
            }`}
          >
            Все группы {allGroupsCount > 0 && `(${allGroupsCount})`}
          </Link>
          {groups.map((g) => (
            <Link
              href={`/actions?${getGroupQueryString(g.id)}`}
              className={`btn btn-sm ${
                initialGroupId === g.id
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              key={g.id}
            >
              {g.title} {groupCounts[g.id] > 0 && `(${groupCounts[g.id]})`}
            </Link>
          ))}
        </div>
      </div>
      <div className="col-auto">
        <div className="form-check form-check-inline">
          <input
            type="checkbox"
            name="strengthAllowed"
            id="strengthAllowed"
            className="form-check-input"
            checked={strengthAllowed}
            onChange={handleStrengthAllowedChange}
          />
          <label className="form-check-label" htmlFor="strengthAllowed">
            Подходит для силовых?
          </label>
        </div>
      </div>
    </div>
  );
}
