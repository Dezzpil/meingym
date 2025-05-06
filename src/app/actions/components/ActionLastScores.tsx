"use client";

import type React from "react";
import classNames from "classnames";
import { FaSpinner } from "react-icons/fa6";
import { useApi } from "@/tools/fetch";

type Props = {
  exerciseId: number;
};
export function ActionLastScores({ exerciseId }: Props) {
  const {
    loading,
    error,
    data: scores,
  } = useApi<{ values: number[]; regress: number; currentIndex: number }>(
    `/api/actions/scores/?id=${exerciseId}`,
  );

  return (
    <div className="d-flex gap-2">
      <b>Оценка:</b>
      {loading && <FaSpinner />}
      {error && <span className="text-danger">{error}</span>}
      {scores && (
        <>
          {scores.values.length === 0 && <span>?</span>}
          {scores.values.length > 0 && (
            <div className="d-flex gap-2">
              {scores.values.map((v, i) => (
                <span
                  key={"" + i + v}
                  className={classNames({
                    "text-success":
                      scores.regress > 0 && i == scores.currentIndex,
                    "text-danger":
                      scores.regress < 0 && i == scores.currentIndex,
                    "fw-light text-muted": i > scores.currentIndex,
                    "fw-bold": i === scores.currentIndex,
                  })}
                >
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
