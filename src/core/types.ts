export type SetsStats = { count: number; sum: number; mean: number };

export type SetData = { weight: number; count: number };

export type SetDataExecuted = SetData & {
  rating: number;
  cheating: true;
  refusing: boolean;
  burning: boolean;
};
