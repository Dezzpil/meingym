-- CreateEnum
CREATE TYPE "TrainingRating" AS ENUM ('EASY', 'OK', 'HARD', 'IMPOSSIBLE');

-- AlterTable
ALTER TABLE "TrainingExercise" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "rating" "TrainingRating" NOT NULL DEFAULT 'OK';
