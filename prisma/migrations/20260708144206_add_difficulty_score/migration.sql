-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TrainingExercise" ADD COLUMN     "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
