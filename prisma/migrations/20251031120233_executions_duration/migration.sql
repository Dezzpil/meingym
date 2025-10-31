-- CreateTable
CREATE TABLE "TrainingExerciseExecutionDuration" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingId" INTEGER NOT NULL,
    "trainingExerciseId" INTEGER NOT NULL,
    "executionId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "seconds" INTEGER NOT NULL,

    CONSTRAINT "TrainingExerciseExecutionDuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingExerciseExecutionDuration_executionId_key" ON "TrainingExerciseExecutionDuration"("executionId");

-- CreateIndex
CREATE INDEX "TrainingExerciseExecutionDuration_trainingId_sequence_idx" ON "TrainingExerciseExecutionDuration"("trainingId", "sequence");

-- CreateIndex
CREATE INDEX "TrainingExerciseExecutionDuration_trainingId_trainingExerci_idx" ON "TrainingExerciseExecutionDuration"("trainingId", "trainingExerciseId");

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionDuration" ADD CONSTRAINT "TrainingExerciseExecutionDuration_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionDuration" ADD CONSTRAINT "TrainingExerciseExecutionDuration_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecutionDuration" ADD CONSTRAINT "TrainingExerciseExecutionDuration_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "TrainingExerciseExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
