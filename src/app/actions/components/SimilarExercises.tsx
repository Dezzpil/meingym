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
  console.log(similarExercises);

  // If no similar exercises, don't render anything
  if (similarExercises.length === 0) {
    return null;
  }

  return (
    <div className={`similar-exercises ${className}`}>
      <h5 className="mb-0">Похожие упражнения</h5>
      <ul className="list-group list-group-flush">
        {similarExercises.map((similar) => (
          <li key={similar.id} className="list-group-item px-0 py-0 border-0">
            <Link
              href={`/actions/${similar.id}/card`}
              className="text-decoration-none"
            >
              {similar.alias || similar.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
