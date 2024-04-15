-- DropForeignKey
ALTER TABLE "TrainingExerciseExecution" DROP CONSTRAINT "TrainingExerciseExecution_approachId_fkey";

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ALTER COLUMN "approachId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecution" ADD CONSTRAINT "TrainingExerciseExecution_approachId_fkey" FOREIGN KEY ("approachId") REFERENCES "Approach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
