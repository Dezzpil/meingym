export type SetsStats = {
  count: number; // sets count
  sum: number; // weight sum by all sets
  mean: number; // weight mean by all sets
  countTotal: number; // counts in all sets
};

export type SetData = { weight: number; count: number };

export type SetDataExecuted = SetData & {
  rating: string;
  cheating: string;
  refusing: string;
  burning: string;
};

export type CurrentPurpose = "MASS" | "STRENGTH" | "LOSS";
