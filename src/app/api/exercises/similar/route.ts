import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../tools/db";
import { ActionWithMusclesType } from "../../../actions/types";
import { RequiresDefault, RigsDefault } from "../../../../core/exercises";
import { ActionRequire, ActionRig } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!params.has("id")) {
    return NextResponse.json({}, { status: 404 });
  }

  const id = +(params.get("id") as string);

  const exercise = await prisma.trainingExercise.findUnique({
    where: { id },
    include: {
      Training: {
        include: { Equipment: { include: { Rigs: true, Requires: true } } },
      },
    },
  });

  if (!exercise) {
    return NextResponse.json({}, { status: 404 });
  }

  const rigs: string[] = [ActionRig.OTHER];
  if (exercise!.Training!.Equipment!.Rigs) {
    for (const rig of exercise!.Training!.Equipment!.Rigs) {
      rigs.push(rig.type);
    }
  }
  if (rigs.length === 0) rigs.push(...RigsDefault);

  const requires: string[] = [ActionRequire.NONE];
  if (exercise!.Training!.Equipment!.Requires) {
    for (const req of exercise!.Training!.Equipment!.Requires) {
      requires.push(req.type);
    }
  }
  if (requires.length === 0) requires.push(...RequiresDefault);

  const include = {
    MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
    MusclesAntagonist: { include: { Muscle: { include: { Group: true } } } },
    MusclesStabilizer: { include: { Muscle: { include: { Group: true } } } },
    MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
  };

  const action = await prisma.action.findUnique({
    where: { id: exercise.actionId },
    include: {
      SimilarFrom: {
        include: {
          SimilarAction: {
            include,
          },
        },
      },
      SimilarTo: {
        include: {
          Action: {
            include,
          },
        },
      },
    },
  });

  const similarActions: ActionWithMusclesType[] = [];

  if (action) {
    for (const similar of action.SimilarTo) {
      const sa = (similar as any).Action;
      if (rigs.includes(action.rig) && requires.includes(action.require)) {
        similarActions.push(sa);
      }
    }

    for (const similar of action.SimilarFrom) {
      const sa = (similar as any).SimilarAction;
      if (rigs.includes(action.rig) && requires.includes(action.require)) {
        similarActions.push(sa);
      }
    }
  }

  return NextResponse.json({ similarActions }, { status: 200 });
}
