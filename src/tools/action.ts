import type { Action } from "@prisma/client";

export function getActionName(action: Action): string {
  return action.alias ? action.alias : action.title;
}
