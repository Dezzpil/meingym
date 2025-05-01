-- CreateTable
CREATE TABLE "ProgressionStrategySimpleOpts" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingPeriodId" INTEGER NOT NULL,
    "strengthWorkingSetsCount" INTEGER NOT NULL DEFAULT 4,
    "strengthPrepareSetsCount" INTEGER NOT NULL DEFAULT 2,
    "massSetsCount" INTEGER NOT NULL DEFAULT 4,
    "massAddDropSet" BOOLEAN NOT NULL DEFAULT true,
    "massBigCountCoef" DOUBLE PRECISION NOT NULL DEFAULT 1.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionStrategySimpleOpts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressionStrategySimpleOpts_trainingPeriodId_key" ON "ProgressionStrategySimpleOpts"("trainingPeriodId");

-- AddForeignKey
ALTER TABLE "ProgressionStrategySimpleOpts" ADD CONSTRAINT "ProgressionStrategySimpleOpts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionStrategySimpleOpts" ADD CONSTRAINT "ProgressionStrategySimpleOpts_trainingPeriodId_fkey" FOREIGN KEY ("trainingPeriodId") REFERENCES "TrainingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
