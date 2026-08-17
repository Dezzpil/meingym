"use client";

import Link from "next/link";
import type { Action } from "@prisma/client";

type SimilarExercisesProps = {
  action: any & {
    SimilarTo?: {
      Action: Action;
    }[];
    SimilarFrom?: {
      SimilarAction: Action;
    }[];
  };
  className?: string;
};

export function SimilarExercises({
  action,
  className = "",
}: SimilarExercisesProps) {
  // Combine similar exercises from both relations
  const similarExercises = [
    ...(action.SimilarTo || []).map((item: any) => item.Action),
    ...(action.SimilarFrom || []).map((item: any) => item.SimilarAction),
  ];

  // If no similar exercises, don't render anything
  if (similarExercises.length === 0) {
    return null;
  }

  return (
    <div className={`similar-exercises ${className}`}>
      <h5 className="mb-2">Похожие упражнения</h5>
      <ul className="list-group">
        {similarExercises.map((similar) => (
          <li
            key={similar.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <Link
              href={`/actions/${similar.id}/card`}
              className="text-decoration-none"
            >
              {similar.alias || similar.title}
            </Link>
            <span className="badge bg-secondary rounded-pill">
              {similar.base}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
