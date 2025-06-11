import { test } from "node:test";
import { assert } from "chai";
import { scheduleCleanupOrphanedImages } from "@/jobs/index";
import { imagesQueue } from "@/jobs/queues";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { prisma } from "@/tools/db";

// Directory to store test images
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

test("Image cleanup job", async (context) => {
  // Ensure the upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Create a test orphaned file
  const testFilename = `test_orphaned_${Date.now()}.gif`;
  const testFilePath = path.join(UPLOAD_DIR, testFilename);
  writeFileSync(testFilePath, "test content");
  console.log(`[DEBUG_LOG] Created test file: ${testFilePath}`);

  // Verify the file exists
  assert.isTrue(existsSync(testFilePath), "Test file should exist");

  await context.test("should schedule the cleanup job", async () => {
    // Clear any existing jobs
    await imagesQueue.empty();

    // Schedule the job
    const result = await scheduleCleanupOrphanedImages();
    assert.exists(result.jobId, "Job ID should exist");
    console.log(`[DEBUG_LOG] Scheduled job with ID: ${result.jobId}`);

    // Process the job manually (this would normally be done by the worker)
    const jobs = await imagesQueue.getJobs(['waiting']);
    assert.isAtLeast(jobs.length, 1, "There should be at least one job in the queue");
    
    // Process the first job
    const job = jobs[0];
    await imagesQueue.process();
    console.log(`[DEBUG_LOG] Processed job: ${job.id}`);

    // Verify the file was deleted
    const fileExists = existsSync(testFilePath);
    console.log(`[DEBUG_LOG] File exists after job: ${fileExists}`);
    assert.isFalse(fileExists, "Orphaned file should be deleted");
  });

  // Cleanup in case the test fails
  if (existsSync(testFilePath)) {
    await fs.unlink(testFilePath);
  }
});