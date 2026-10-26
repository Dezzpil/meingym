#!/usr/bin/env node

// Полный пересчёт плановой и фактической сложности и нагрузки по группам мышц
// по всей истории тренировок. Идемпотентен: каждый тренировочный агрегат
// пересоздаётся из исходных данных, поэтому годится и для первичного наполнения
// после миграции, и для лечения расхождений (например у тренировок, приехавших с телефона).

import { prisma } from "@/tools/db";
import dotenv from "dotenv";
import {
  recalculateExerciseDifficulty,
  recalculateTrainingDifficulty,
} from "@/core/difficulty/recalculate";
import { recomputeTrainingMuscleLoad } from "@/core/muscleLoad/recalculate";

dotenv.config({
  path: ".env.local",
});

async function updateMuscleLoads() {
  console.log("Starting to recalculate training loads...");

  const trainings = await prisma.training.findMany({
    select: { id: true, plannedTo: true },
    orderBy: { plannedTo: "asc" },
  });

  let done = 0;
  let failed = 0;
  for (const training of trainings) {
    try {
      const exercises = await prisma.trainingExercise.findMany({
        where: { trainingId: training.id },
        select: { id: true },
      });
      for (const exercise of exercises) {
        await recalculateExerciseDifficulty(exercise.id);
      }
      await recalculateTrainingDifficulty(training.id);
      await recomputeTrainingMuscleLoad(training.id);
      done += 1;
    } catch (error) {
      failed += 1;
      console.error(`Training ${training.id} failed:`, error);
    }
    if ((done + failed) % 50 === 0) {
      console.log(`Processed ${done + failed} of ${trainings.length}`);
    }
  }

  console.log(`Recalculated loads: ${done} trainings, failed: ${failed}`);
}

updateMuscleLoads()
  .then(() => {
    console.log("Recalculating training loads completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during recalculating training loads:", error);
    process.exit(1);
  });
