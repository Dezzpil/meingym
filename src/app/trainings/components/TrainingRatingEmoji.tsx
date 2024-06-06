"use client";

import { TrainingRating } from "@prisma/client";

type Props = {
  rating: TrainingRating;
};
const map = {
  [TrainingRating.EASY]: "🤓 🟡",
  [TrainingRating.OK]: "🙂 🟢",
  [TrainingRating.HARD]: "😬 🟡",
  [TrainingRating.IMPOSSIBLE]: "😵‍💫 🔴",
};

export function TrainingRatingEmoji({ rating }: Props) {
  return <span>{map[rating]}</span>;
}
