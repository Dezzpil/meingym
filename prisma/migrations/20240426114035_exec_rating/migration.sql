-- CreateEnum
CREATE TYPE "ExecutionRating" AS ENUM ('EASY', 'OK', 'TENSION_OK', 'TENSION_FLAW', 'HARD');

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "rating" "ExecutionRating" NOT NULL DEFAULT 'OK';
