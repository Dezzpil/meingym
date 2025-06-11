import { prisma } from "@/tools/db";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// Directory where images are stored
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Processor for cleaning up orphaned exercise images
 * Identifies and removes image files that exist on the filesystem
 * but are no longer referenced in the database
 */
export const cleanupImagesProcessor = async (job: any) => {
  console.log("Starting cleanup of orphaned exercise images...");

  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      console.log("Upload directory does not exist, nothing to clean up");
      return {
        success: true,
        message: "Upload directory does not exist, nothing to clean up",
      };
    }

    // Get all files in the uploads directory
    const files = await fs.readdir(UPLOAD_DIR);
    console.log(`Found ${files.length} files in uploads directory`);

    // Get all image records from the database
    const dbImages = await prisma.exerciseImage.findMany({
      select: {
        filename: true,
      },
    });
    console.log(`Found ${dbImages.length} image records in database`);

    // Create a set of filenames from the database for faster lookup
    const dbFilenames = new Set(dbImages.map((img) => img.filename));

    // Identify orphaned files (files that exist on disk but not in the database)
    const orphanedFiles = files.filter((file) => !dbFilenames.has(file));
    console.log(`Found ${orphanedFiles.length} orphaned files to clean up`);

    // Delete orphaned files
    let deletedCount = 0;
    for (const file of orphanedFiles) {
      const filePath = path.join(UPLOAD_DIR, file);
      try {
        await fs.unlink(filePath);
        deletedCount++;
        console.log(`Deleted orphaned file: ${file}`);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }

    return {
      success: true,
      message: `Successfully cleaned up ${deletedCount} orphaned image files`,
      deletedCount,
      orphanedFilesCount: orphanedFiles.length,
    };
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};