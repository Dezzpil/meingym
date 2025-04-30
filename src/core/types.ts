export type SetsStats = {
  len: number; // sets count
  weightSum: number;
  weightMean: number;
  weightMax: number;
  countSum: number;
  countMean: number;
};

export type SetData = { weight: number; count: number };

export type SetDataExecuted = SetData & {
  rating: string;
  cheating: string;
  refusing: string;
  burning: string;
};

export type CurrentPurpose = "MASS" | "STRENGTH" | "LOSS";
