/*
  Warnings:

  - You are about to drop the column `timeScore` on the `Training` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Training" DROP COLUMN "timeScore",
ADD COLUMN     "timeScoreInMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "timeScoreInSecs" TEXT;
