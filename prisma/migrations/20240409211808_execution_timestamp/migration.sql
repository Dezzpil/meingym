-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "isPassed" BOOLEAN NOT NULL DEFAULT false;
