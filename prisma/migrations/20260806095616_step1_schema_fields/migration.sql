/*
  Warnings:

  - A unique constraint covering the columns `[userId,externalId]` on the table `Training` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MuscleRole" AS ENUM ('PRIMARY', 'SECONDARY', 'STABILIZER', 'OTHER');

-- AlterTable
ALTER TABLE "Muscle" ADD COLUMN     "role" "MuscleRole" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "calculatedDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "syncedFromMobile" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MuscleGroupLink" (
    "id" SERIAL NOT NULL,
    "muscleGroupId" INTEGER NOT NULL,
    "linkedGroupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuscleGroupLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDifficultyHistory" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingDifficultyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimilarMuscles" (
    "id" SERIAL NOT NULL,
    "muscleId" INTEGER NOT NULL,
    "similarMuscleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimilarMuscles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuscleGroupLink_muscleGroupId_linkedGroupId_key" ON "MuscleGroupLink"("muscleGroupId", "linkedGroupId");

-- CreateIndex
CREATE INDEX "TrainingDifficultyHistory_trainingId_version_idx" ON "TrainingDifficultyHistory"("trainingId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SimilarMuscles_muscleId_similarMuscleId_key" ON "SimilarMuscles"("muscleId", "similarMuscleId");

-- CreateIndex
CREATE UNIQUE INDEX "Training_userId_externalId_key" ON "Training"("userId", "externalId");

-- AddForeignKey
ALTER TABLE "MuscleGroupLink" ADD CONSTRAINT "MuscleGroupLink_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleGroupLink" ADD CONSTRAINT "MuscleGroupLink_linkedGroupId_fkey" FOREIGN KEY ("linkedGroupId") REFERENCES "MuscleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDifficultyHistory" ADD CONSTRAINT "TrainingDifficultyHistory_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimilarMuscles" ADD CONSTRAINT "SimilarMuscles_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimilarMuscles" ADD CONSTRAINT "SimilarMuscles_similarMuscleId_fkey" FOREIGN KEY ("similarMuscleId") REFERENCES "Muscle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
