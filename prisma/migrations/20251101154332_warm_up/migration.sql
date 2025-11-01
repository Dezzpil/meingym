-- CreateTable
CREATE TABLE "TrainingWarmUp" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingId" INTEGER NOT NULL,
    "estimatedTimeSec" INTEGER NOT NULL DEFAULT 300,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "durationSec" INTEGER,

    CONSTRAINT "TrainingWarmUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingWarmUp_trainingId_key" ON "TrainingWarmUp"("trainingId");

-- AddForeignKey
ALTER TABLE "TrainingWarmUp" ADD CONSTRAINT "TrainingWarmUp_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
