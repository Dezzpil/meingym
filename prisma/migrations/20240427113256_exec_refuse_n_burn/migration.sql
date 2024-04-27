-- CreateEnum
CREATE TYPE "ExecutionRefusing" AS ENUM ('NO', 'YES');

-- CreateEnum
CREATE TYPE "ExecutionBurning" AS ENUM ('NO', 'YES');

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "burning" "ExecutionBurning" NOT NULL DEFAULT 'NO',
ADD COLUMN     "refusing" "ExecutionRefusing" NOT NULL DEFAULT 'NO';
