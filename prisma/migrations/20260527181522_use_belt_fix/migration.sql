/*
  Warnings:

  - You are about to drop the column `useBelts` on the `TrainingExerciseExecution` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrainingExerciseExecution" DROP COLUMN "useBelts",
ADD COLUMN     "useBelt" BOOLEAN NOT NULL DEFAULT false;
