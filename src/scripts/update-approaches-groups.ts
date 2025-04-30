#!/usr/bin/env node

import { prisma } from "@/tools/db";
import dotenv from "dotenv";
import {
  calculateStats,
  findInfoForCalculateStatsForApproach,
} from "@/core/stats";

dotenv.config({
  path: ".env.local",
});

async function updateApproachesGroups() {
  console.log("Starting to updating approaches groups...");

  const groups = await prisma.approachesGroup.findMany({
    include: { Approaches: true },
  });
  for (const group of groups) {
    if (group.max === 0 || group.countTotal === 0 || group.countMean === 0) {
      const info = await findInfoForCalculateStatsForApproach(group.id);
      const data = group.Approaches;
      const stats = calculateStats(data, info.actionrig, info.userweight);
      await prisma.approachesGroup.update({
        where: { id: group.id },
        data: {
          max: stats.weightMax,
          countTotal: stats.countSum,
          countMean: stats.countMean,
        },
      });
      console.log(
        `Updating group ${group.id} with: max=${stats.weightMax}, countTotal=${stats.countSum}, countMean=${stats.countMean}`,
      );
    }
  }
}

updateApproachesGroups()
  .then(() => {
    console.log("Updating approaches groups completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during updating approaches groups:", error);
    process.exit(1);
  });
