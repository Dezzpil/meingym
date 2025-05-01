-- CreateTable
CREATE TABLE "TrainingExerciseExecutionScore" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "actionId" INTEGER NOT NULL,
    "purpose" "Purpose" NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "trainingExerciseExecutionId" INTEGER NOT NULL,
    "liftedSumNorm" DOUBLE PRECISION NOT NULL,
    "liftedMeanNorm" DOUBLE PRECISION NOT NULL,
    "liftedCountTotalNorm" DOUBLE PRECISION NOT NULL,
    "maxWeightNorm" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TrainingExerciseExecutionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingExerciseExecutionScore_userId_actionId_purpose_crea_idx" ON "TrainingExerciseExecutionScore"("userId", "actionId", "purpose", "createdAt");

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" ADD CONSTRAINT "TrainingExerciseExecutionScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" ADD CONSTRAINT "TrainingExerciseExecutionScore_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" ADD CONSTRAINT "TrainingExerciseExecutionScore_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionScore" ADD CONSTRAINT "TrainingExerciseExecutionScore_trainingExerciseExecutionId_fkey" FOREIGN KEY ("trainingExerciseExecutionId") REFERENCES "TrainingExerciseExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
