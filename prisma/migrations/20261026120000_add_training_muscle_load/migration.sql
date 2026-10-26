-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "executedDifficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "muscleSignature" TEXT;

-- CreateTable
CREATE TABLE "TrainingMuscleLoad" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "muscleGroupId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "plannedLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executedLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agonyCnt" INTEGER NOT NULL DEFAULT 0,
    "synergyCnt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingMuscleLoad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingMuscleLoad_userId_muscleGroupId_idx" ON "TrainingMuscleLoad"("userId", "muscleGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMuscleLoad_trainingId_muscleGroupId_key" ON "TrainingMuscleLoad"("trainingId", "muscleGroupId");

-- CreateIndex
CREATE INDEX "Training_userId_muscleSignature_plannedTo_idx" ON "Training"("userId", "muscleSignature", "plannedTo");

-- AddForeignKey
ALTER TABLE "TrainingMuscleLoad" ADD CONSTRAINT "TrainingMuscleLoad_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMuscleLoad" ADD CONSTRAINT "TrainingMuscleLoad_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMuscleLoad" ADD CONSTRAINT "TrainingMuscleLoad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
