/*
  Warnings:

  - You are about to drop the `TrainingExerciseExecutionScore` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" DROP CONSTRAINT "TrainingExerciseExecutionScore_actionId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" DROP CONSTRAINT "TrainingExerciseExecutionScore_trainingExerciseExecutionId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" DROP CONSTRAINT "TrainingExerciseExecutionScore_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" DROP CONSTRAINT "TrainingExerciseExecutionScore_userId_fkey";

-- DropTable
DROP TABLE "TrainingExerciseExecutionScore";

-- CreateTable
CREATE TABLE "TrainingExerciseScore" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "actionId" INTEGER NOT NULL,
    "purpose" "Purpose" NOT NULL,
    "trainingExerciseId" INTEGER NOT NULL,
    "liftedSumNorm" DOUBLE PRECISION NOT NULL,
    "liftedMeanNorm" DOUBLE PRECISION NOT NULL,
    "liftedCountTotalNorm" DOUBLE PRECISION NOT NULL,
    "maxWeightNorm" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TrainingExerciseScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingExerciseScore_userId_actionId_purpose_createdAt_idx" ON "TrainingExerciseScore"("userId", "actionId", "purpose", "createdAt");

-- AddForeignKey
ALTER TABLE "TrainingExerciseScore" ADD CONSTRAINT "TrainingExerciseScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseScore" ADD CONSTRAINT "TrainingExerciseScore_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseScore" ADD CONSTRAINT "TrainingExerciseScore_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
