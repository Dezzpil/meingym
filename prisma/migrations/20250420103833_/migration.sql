/*
  Warnings:

  - You are about to drop the column `maxWeight` on the `ApproachesGroup` table. All the data in the column will be lost.
  - You are about to drop the column `maxWeight` on the `TrainingExercise` table. All the data in the column will be lost.
  - You are about to drop the column `maxWeightNorm` on the `TrainingExerciseScore` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApproachesGroup" DROP COLUMN "maxWeight",
ADD COLUMN     "countMean" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "max" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "sum" SET DEFAULT 0,
ALTER COLUMN "sum" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TrainingExercise" DROP COLUMN "maxWeight",
ADD COLUMN     "liftedCountMean" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "liftedMax" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TrainingExerciseScore" DROP COLUMN "maxWeightNorm",
ADD COLUMN     "coefficients" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "liftedCountMeanNorm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "liftedMaxNorm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "trainingExerciseId" SET DEFAULT 0,
ALTER COLUMN "liftedSumNorm" SET DEFAULT 0,
ALTER COLUMN "liftedMeanNorm" SET DEFAULT 0,
ALTER COLUMN "liftedCountTotalNorm" SET DEFAULT 0,
ALTER COLUMN "score" SET DEFAULT 0;
