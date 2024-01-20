-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('MASS', 'STRENGTH');

-- CreateTable
CREATE TABLE "Training" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planedTo" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExercise" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "approachGroupId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "purpose" "Purpose" NOT NULL,

    CONSTRAINT "TrainingExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExerciseExecution" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "plannedWeigth" INTEGER NOT NULL,
    "plannedCount" INTEGER NOT NULL,
    "liftedWeight" INTEGER NOT NULL,
    "liftedCount" INTEGER NOT NULL,

    CONSTRAINT "TrainingExerciseExecution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_approachGroupId_fkey" FOREIGN KEY ("approachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecution" ADD CONSTRAINT "TrainingExerciseExecution_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "TrainingExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
