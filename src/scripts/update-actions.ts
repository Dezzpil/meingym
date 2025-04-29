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
      },
    });

    console.log(`Found ${actions.length} actions to update`);

    // Process each action
    for (const action of actions) {
      try {
        // Prepare data in the format expected by handleUpdate
        const data = {
          title: action.title,
          desc: action.desc || "",
          alias: action.alias || "",
          anotherTitles: action.anotherTitles || "",
          rig: action.rig,
          strengthAllowed: action.strengthAllowed,
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
