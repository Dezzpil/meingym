/*
  Warnings:

  - You are about to drop the column `createdAt` on the `TrainingWarmUp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrainingWarmUp" DROP COLUMN "createdAt",
ADD COLUMN     "startedAt" TIMESTAMP(3);
