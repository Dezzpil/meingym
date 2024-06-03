-- AlterTable
ALTER TABLE "ApproachesGroup" ADD COLUMN     "countTotal" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TrainingExercise" ADD COLUMN     "liftedCountTotal" INTEGER NOT NULL DEFAULT 0;
