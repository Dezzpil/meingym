-- CreateEnum
CREATE TYPE "ExecutionTechnique" AS ENUM ('OK', 'FLAW');

-- AlterEnum
ALTER TYPE "ExecutionRating" ADD VALUE 'TENSION';

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ADD COLUMN     "technique" "ExecutionTechnique" NOT NULL DEFAULT 'OK',
ADD COLUMN     "techniqueUpgrade" BOOLEAN NOT NULL DEFAULT false;
