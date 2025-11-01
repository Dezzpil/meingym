-- CreateTable
CREATE TABLE "TrainingMuscleStat" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "muscleId" INTEGER NOT NULL,
    "muscleGroupId" INTEGER NOT NULL,
    "asAgonyCnt" INTEGER NOT NULL DEFAULT 0,
    "asSynerCnt" INTEGER NOT NULL DEFAULT 0,
    "asStableCnt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingMuscleStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingMuscleStat_trainingId_idx" ON "TrainingMuscleStat"("trainingId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMuscleStat_trainingId_muscleId_key" ON "TrainingMuscleStat"("trainingId", "muscleId");

-- AddForeignKey
ALTER TABLE "TrainingMuscleStat" ADD CONSTRAINT "TrainingMuscleStat_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMuscleStat" ADD CONSTRAINT "TrainingMuscleStat_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMuscleStat" ADD CONSTRAINT "TrainingMuscleStat_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
