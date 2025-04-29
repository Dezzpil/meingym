#!/usr/bin/env node

import { prisma } from "@/tools/db";
import { handleUpdate } from "@/app/actions/actions";
import dotenv from "dotenv";
import {
  calculateStats,
  findInfoForCalculationStatsForAction,
} from "@/core/stats";
import { SetData } from "@/core/types";
import { createScore } from "@/core/scores";

dotenv.config({
  path: ".env.local",
});

async function updateTrainingExercises() {
  console.log("Starting to updating training exercises...");

  const exercises = await prisma.trainingExercise.findMany({
    where: {
      completedAt: { not: null },
      isPassed: false,
    },
    include: {
      Training: true,
      Score: true,
    },
  });
  for (const exercise of exercises) {
    let liftedMax = exercise.liftedMax;
    let liftedCountMean = exercise.liftedCountMean;
    if (liftedMax === 0 && liftedCountMean === 0) {
      await prisma.$transaction(async (tx) => {
        const executions = await tx.trainingExerciseExecution.findMany({
          where: { exerciseId: exercise.id, isPassed: false },
        });
        const sets: SetData[] = executions.map((e) => {
          return { weight: e.liftedWeight, count: e.liftedCount };
        });
        const info = await findInfoForCalculationStatsForAction(
          exercise.actionId,
          exercise.Training.userId,
          tx,
        );
        const stats = calculateStats(sets, info.actionrig, info.userweight);
        liftedMax = stats.weightMax;
        liftedCountMean = stats.countMean;

        await tx.trainingExercise.update({
          where: { id: exercise.id },
          data: { liftedMax, liftedCountMean },
        });
        console.log(
          "Updated liftedMax and liftedCountMean for exercise",
          exercise.id,
        );
      });
    }
    if (exercise.Score.length === 0) {
      const score = await createScore(exercise);
      console.log(`Created score ${score.id} for exercise ${exercise.id}`);
    }
  }
}

updateTrainingExercises()
  .then(() => {
    console.log("Updating training exercises completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during updating training exercises:", error);
    process.exit(1);
  });
