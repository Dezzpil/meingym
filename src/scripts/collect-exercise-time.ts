#!/usr/bin/env node

import { prisma } from "@/tools/db";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

async function collect() {}

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
