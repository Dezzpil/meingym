import type { PrismaClient } from "@prisma/client";
import * as runtime from "@prisma/client/runtime/library";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  runtime.ITXClientDenyList
>;

export type ItemPageParams = {
  params: { id: string };
};

export type PageParams = {
  searchParams: Record<string, string>;
};

export type ServerActionResult = {
  ok: boolean;
  error: null | string;
};
