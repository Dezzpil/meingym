import { NextRequest, NextResponse } from "next/server";
import type { Action } from "@prisma/client";
import { prisma } from "@/tools/db";

export type Data = {
  term: string;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const actions: Action[] = [];
  const map = new Map();
  if (params.has("term")) {
    const term = (params.get("term") as string).trim().toLowerCase();
    const parts = term.split(" ");
    while (parts.length) {
      const contains = parts.join("%");
      const found = await prisma.action.findMany({
        where: {
          search: { contains },
        },
        include: {
          MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
          MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
          MusclesStabilizer: {
            include: { Muscle: { include: { Group: true } } },
          },
        },
      });
      found.forEach((f) => map.set(f.id, f));
      parts.pop();
    }
    actions.push(...Array.from(map.values()));
  }

  return NextResponse.json(actions, { status: 200 });
}
