-- AlterTable
ALTER TABLE "Approach" ALTER COLUMN "weight" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TrainingExerciseExecution" ALTER COLUMN "plannedWeigth" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "liftedWeight" SET DATA TYPE DOUBLE PRECISION;
