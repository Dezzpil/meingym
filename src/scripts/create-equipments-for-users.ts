#!/usr/bin/env node

import { prisma } from "@/tools/db";
import { ActionRequire, ActionRig } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

async function createEquipmentForExistedUsers() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const equipments = await prisma.equipment.findMany({
      where: {
        userId: user.id,
      },
    });

    if (equipments.length > 0) continue;

    await prisma.equipment.create({
      data: {
        userId: user.id,
        name: "Тренажерный зал",
        isDefault: true,
        Rigs: {
          createMany: {
            data: [
              {
                type: ActionRig.BARBELL,
                minWeight: 10,
                step: 5,
                maxWeight: 200,
              },
              {
                type: ActionRig.BLOCKS,
                minWeight: 5,
                step: 1,
                maxWeight: 200,
              },
              {
                type: ActionRig.DUMBBELL,
                minWeight: 5,
                step: 2.5,
                maxWeight: 50,
              },
              {
                type: ActionRig.KETTLEBELL,
                minWeight: 6,
                step: 2,
                maxWeight: 30,
              },
            ],
          },
        },
        Requires: {
          createMany: {
            data: [
              { type: ActionRequire.BENCH },
              { type: ActionRequire.UPBAR },
              { type: ActionRequire.SIMULATOR },
            ],
          },
        },
      },
    });
  }
}

// Run the update function
createEquipmentForExistedUsers()
  .then(() => {
    console.log("Created equipments for existed users completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error script:", error);
    process.exit(1);
  });
