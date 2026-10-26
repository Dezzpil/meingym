#!/usr/bin/env node

import { prisma } from "@/tools/db";
import { handleUpdate } from "@/app/actions/actions";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

async function updateActions() {
  console.log("Starting to update all actions...");

  try {
    // Fetch all actions from the database
    const actions = await prisma.action.findMany({
      include: {
        MusclesAgony: true,
        MusclesSynergy: true,
        MusclesStabilizer: true,
        MusclesAntagonist: true,
      },
    });

    console.log(`Found ${actions.length} actions to update`);

    // Process each action
    for (const action of actions) {
      try {
        // Проверка, что связи загрузились
        if (!action.MusclesAgony || !Array.isArray(action.MusclesAgony)) {
          console.error(
            `Action ${action.id} (${action.title}): MusclesAgony is not an array`,
            action.MusclesAgony,
          );
          continue;
        }
        if (!action.MusclesSynergy || !Array.isArray(action.MusclesSynergy)) {
          console.error(
            `Action ${action.id} (${action.title}): MusclesSynergy is not an array`,
            action.MusclesSynergy,
          );
          continue;
        }
        if (
          !action.MusclesStabilizer ||
          !Array.isArray(action.MusclesStabilizer)
        ) {
          console.error(
            `Action ${action.id} (${action.title}): MusclesStabilizer is not an array`,
            action.MusclesStabilizer,
          );
          continue;
        }
        if (
          !action.MusclesAntagonist ||
          !Array.isArray(action.MusclesAntagonist)
        ) {
          console.error(
            `Action ${action.id} (${action.title}): MusclesAntagonist is not an array`,
            action.MusclesAntagonist,
          );
          continue;
        }

        // Prepare data in the format expected by handleUpdate
        const data = {
          title: action.title,
          desc: action.desc || "",
          alias: action.alias || "",
          anotherTitles: action.anotherTitles || "",
          rig: action.rig,
          require: action.require,
          bigCount: action.bigCount,
          allowCheating: action.allowCheating,
          musclesAgonyIds: action.MusclesAgony.map((m) =>
            m.muscleId.toString(),
          ),
          musclesSynergyIds: action.MusclesSynergy.map((m) =>
            m.muscleId.toString(),
          ),
          musclesStabilizerIds: action.MusclesStabilizer.map((m) =>
            m.muscleId.toString(),
          ),
          musclesAntagonistIds: action.MusclesAntagonist.map((m) =>
            m.muscleId.toString(),
          ),
          similarExerciseIds: [],
        };

        // @ts-ignore
        await handleUpdate(action.id, data);
        console.log(`Updated action: ${action.title} (ID: ${action.id})`);
      } catch (error) {
        console.error(
          `Error updating action ${action.id} (${action.title}):`,
          error,
        );
      }
    }

    console.log("All actions have been updated successfully!");
  } catch (error) {
    console.error("Error updating actions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateActions()
  .then(() => {
    console.log("Update actions completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during update actions:", error);
    process.exit(1);
  });
