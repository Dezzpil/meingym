import { NextRequest, NextResponse } from "next/server";
import { ActionRequire, ActionRig, type Action } from "@prisma/client";
import { prisma } from "@/tools/db";
import { RequiresDefault, RigsDefault } from "../../../../core/exercises";

export type Data = {
  term: string;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const actions: Action[] = [];
  if (!params.has("term")) {
    return NextResponse.json(actions, { status: 200 });
  }

  const rigs = params.has("rigs")
    ? params.get("rigs")!.split(",")
    : RigsDefault;
  const requires = params.has("requires")
    ? params.get("requires")!.split(",")
    : RequiresDefault;

  const term = (params.get("term") as string).trim().toLowerCase();

  // Первое слово — самый широкий подстрочный фильтр, покрывает все варианты "a%b%c", "a%b", "a".
  // GIN trigram индекс по Action.search обслуживает LIKE '%...%' за один запрос.
  const contains = term.split(" ")[0];
  const found = await prisma.action.findMany({
    where: {
      search: { contains },
      rig: { in: rigs as ActionRig[] },
      require: { in: requires as ActionRequire[] },
    },
    include: {
      MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
      MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
      MusclesStabilizer: {
        include: { Muscle: { include: { Group: true } } },
      },
      MusclesAntagonist: {
        include: { Muscle: { include: { Group: true } } },
      },
    },
  });
  actions.push(...found);

  return NextResponse.json(actions, { status: 200 });
}
