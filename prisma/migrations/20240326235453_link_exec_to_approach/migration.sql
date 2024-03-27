/*
  Warnings:

  - Added the required column `approachId` to the `TrainingExerciseExecution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "approachId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecution" ADD CONSTRAINT "TrainingExerciseExecution_approachId_fkey" FOREIGN KEY ("approachId") REFERENCES "Approach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
