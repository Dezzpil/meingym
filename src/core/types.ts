export type SetsStats = { count: number; sum: number; mean: number };

export type SetData = { weight: number; count: number };

export type SetDataExecuted = SetData & {
  rating: string;
  cheating: string;
  refusing: string;
  burning: string;
};
