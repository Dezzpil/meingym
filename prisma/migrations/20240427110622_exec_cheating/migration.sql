-- CreateEnum
CREATE TYPE "ExecutionCheating" AS ENUM ('NO', 'PART', 'FULL');

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "cheating" "ExecutionCheating" NOT NULL DEFAULT 'NO';
