#!/usr/bin/env node

// Полный пересчёт персональных рекордов всех пользователей по истории тренировок.
// Идемпотентен: удаляет существующие записи и создаёт заново,
// поэтому подходит и для первичного наполнения, и для лечения расхождений.

import { prisma } from "@/tools/db";
import dotenv from "dotenv";
import { recalculatePersonalRecordsForUser } from "@/core/records";

dotenv.config({
  path: ".env.local",
});

async function updatePersonalRecords() {
  console.log("Starting to recalculate personal records...");

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  let total = 0;
  for (const user of users) {
    const created = await recalculatePersonalRecordsForUser(user.id);
    total += created;
    console.log(`Recalculated records for ${user.email}: ${created} entries`);
  }

  console.log(`Total personal records created: ${total}`);
}

updatePersonalRecords()
  .then(() => {
    console.log("Recalculating personal records completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during recalculating personal records:", error);
    process.exit(1);
  });
