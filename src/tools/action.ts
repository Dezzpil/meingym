import type { Action } from "@prisma/client";

export function getActionName(action: Action): string {
  return action.alias ? action.alias : action.title;
}

// Ссылки похожести хранятся направленными (actionId -> similarActionId),
// но читаются как двунаправленные: пара может быть связана в обе стороны,
// поэтому обе реляции объединяются с удалением дубликатов по id упражнения.
export function getSimilarActions<A extends { id: number }>(action: {
  SimilarTo?: { Action: A }[] | null;
  SimilarFrom?: { SimilarAction: A }[] | null;
}): A[] {
  const byId = new Map<number, A>();
  for (const link of action.SimilarTo ?? []) byId.set(link.Action.id, link.Action);
  for (const link of action.SimilarFrom ?? [])
    byId.set(link.SimilarAction.id, link.SimilarAction);
  return Array.from(byId.values());
}

export function getSimilarActionIds(action: {
  SimilarTo?: { actionId: number }[] | null;
  SimilarFrom?: { similarActionId: number }[] | null;
}): number[] {
  const ids = new Set<number>();
  for (const link of action.SimilarTo ?? []) ids.add(link.actionId);
  for (const link of action.SimilarFrom ?? []) ids.add(link.similarActionId);
  return Array.from(ids);
}
