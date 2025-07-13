import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import { Purpose, type Action } from "@prisma/client";
import { findUserInfo, getCurrentUserId } from "@/tools/auth";
import { createTrainingPeriod, getCurrentTrainingPeriod } from "@/core/periods";
import { createExercise } from "@/core/exercises";
import { IntegrationTrainingTimeScorer } from "@/integrations/trainingTime/scorer";

type CreateTrainingRequestType = {
  userId: string;
  muscleGroup: string[];
  exercises: string[];
  comments: string;
  // plannedTo: Date;
};

async function findExerciseByText(name: string) {
  const contains = name.trim().toLowerCase();
  return prisma.action.findMany({
    where: {
      search: { contains },
    },
  });
}

export async function POST(request: NextRequest) {
  const data = (await request.json()) as CreateTrainingRequestType;
  console.log(data);

  if (!data.userId) {
    return NextResponse.json({ path: null }, { status: 401 });
  }
  const userInfo = await findUserInfo(data.userId);
  if (!userInfo) {
    return NextResponse.json({ path: null }, { status: 401 });
  }
  let currentPeriod = await getCurrentTrainingPeriod(data.userId);
  if (!currentPeriod) {
    currentPeriod = await createTrainingPeriod(data.userId);
  }

  const actionsMap = new Map<number, Action>();
  const chosenActions = new Map<number, Action>();

  for (const muscleGroup of data.muscleGroup) {
    const allActionsForMuscleGroup = await findExerciseByText(muscleGroup);
    allActionsForMuscleGroup.forEach((a) => actionsMap.set(a.id, a));
  }

  console.log(
    `found ${actionsMap.size} actions for muscle groups ${data.muscleGroup}`,
  );

  for (const actionName of data.exercises) {
    const actionNamePrep = actionName
      .replace(/(\(.+?\))/gu, "")
      .trim()
      .toLowerCase()
      .split(/[-\s]/);
    console.log(`action name prepared: ${actionNamePrep}`);
    const actionPrepShort = actionNamePrep
      .slice(0, Math.min(3, actionNamePrep.length))
      .join(" ");
    console.log(`action name shorted: ${actionPrepShort}`);
    const found = await findExerciseByText(actionPrepShort);
    if (found.length) {
      for (const f of found) {
        if (actionsMap.size > 0 && actionsMap.has(f.id)) {
          chosenActions.set(f.id, f);
        } else {
          chosenActions.set(f.id, f);
        }
      }
    }
  }

  console.log(`chosen ${chosenActions.size} actions for training`);

  // найти существующие упражнения

  const training = await prisma.training.create({
    data: Object.assign(
      {
        plannedTo: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        userId: data.userId,
        periodId: currentPeriod.id,
        commonComment: data.comments,
      },
      userInfo.purpose === "LOSS" ? { isCircuit: true } : {},
    ),
  });

  // TODO нет сортировки упражнений (нет оценки упражнений по сложности)

  for (const action of Array.from(chosenActions.values())) {
    await prisma.$transaction(async (tx) => {
      try {
        await createExercise(
          training.id,
          action.id,
          userInfo.purpose,
          data.userId,
          tx,
        );
      } catch (error) {
        if (
          (error as any).message ===
          "Нельзя выбрать силовое выполнение для этого движения"
        ) {
          await createExercise(
            training.id,
            action.id,
            Purpose.MASS,
            data.userId,
            tx,
          );
        } else {
          console.error(error);
        }
      }
    });

    new IntegrationTrainingTimeScorer().update(training.id).then();
  }

  return NextResponse.json(
    { path: `/trainings/${training.id}` },
    { status: 200 },
  );
}
