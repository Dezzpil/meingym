#!/usr/bin/env node

import { prisma } from "@/tools/db";
import dotenv from "dotenv";
import { open } from "node:fs/promises";
import { write } from "node:fs";
import { Action, User, UserInfo } from "@prisma/client";

dotenv.config({
  path: ".env.local",
});

type ActionWithMuscles = Action & { MusclesAgony: { muscleId: number }[] };
const ActionsCache: Record<number, ActionWithMuscles> = {};

async function _cacheAction(actionId: number): Promise<void> {
  if (!(actionId in ActionsCache)) {
    ActionsCache[actionId as number] = (await prisma.action.findUnique({
      where: { id: actionId },
      include: {
        MusclesAgony: true,
      },
    })) as ActionWithMuscles;
  }
}

type UserWithInfo = User & { UserInfo: UserInfo[] } & { weight: number };
const UsersCache: Record<string, UserWithInfo> = {};

async function _cacheUser(userId: string): Promise<void> {
  if (!(userId in UsersCache)) {
    UsersCache[userId] = (await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserInfo: true,
      },
    })) as UserWithInfo;

    UsersCache[userId]["weight"] = 70;
    const lastWeight = await prisma.weight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (lastWeight) {
      UsersCache[userId as string]["weight"] = lastWeight.value;
    }
  }
}

async function collect() {
  const fd = await open(`./${Date.now()}-exercises-execution-time.csv`, "w");
  // TODO создать заголовки для колонок исходя из того, что в row

  const trainings = await prisma.training.findMany({
    where: {
      startedAt: { not: null },
      completedAt: { not: null },
    },
  });
  console.log(`found ${trainings.length} trainings`);

  for (const training of trainings) {
    await _cacheUser(training.userId as string);
    const user = UsersCache[training.userId as string];

    let startedAt = training.startedAt as Date;
    console.log(`${training.id}: started at ${startedAt}`);

    const exercises = await prisma.trainingExercise.findMany({
      where: {
        trainingId: training.id,
        isPassed: false,
      },
      orderBy: {
        priority: "asc",
      },
    });
    console.log(
      `${training.id}: found ${exercises.length} non-passed exercises`,
    );

    for (const exercise of exercises) {
      await _cacheAction(exercise.actionId);
      const action = ActionsCache[exercise.actionId as number];

      const executions = await prisma.trainingExerciseExecution.findMany({
        where: {
          exerciseId: exercise.id,
          executedAt: { not: null },
          isPassed: false,
        },
        orderBy: { executedAt: "asc" },
      });

      for (const execution of executions) {
        const duration = execution.executedAt!.getTime() - startedAt.getTime();
        startedAt = execution.executedAt!;

        const row = [
          execution.id, // index
          user.UserInfo[0].sex, // user_sex
          user.UserInfo[0].height, // user_height
          user.UserInfo[0].purpose, // user_global
          user.weight, // user_weight
          training.startedAt, // train_started
          training.isCircuit, // train_circuit
          exercise.purpose, // exer_purpose
          exercise.priority, // exer_priority
          action.rig, // action_rig
          action.allowCheating, // action_cheat
          action.bigCount, // action_bigcount
          action.strengthAllowed, // action_str_allow
          action.MusclesAgony.length, // action_muscles_len
          executions.length, // exec_length
          execution.plannedWeigth, // exec_weight
          execution.plannedCount, // exec_count
          duration, // target
        ];
        // TODO пишем строчку в .csv-файл
      }
    }
  }

  await fd.close();
}

// Run the update function
collect()
  .then(() => {
    console.log("Completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
