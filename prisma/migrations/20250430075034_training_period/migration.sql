-- CreateTable
CREATE TABLE "TrainingPeriod" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingPeriod_userId_isCurrent_idx" ON "TrainingPeriod"("userId", "isCurrent");

-- AddForeignKey
ALTER TABLE "TrainingPeriod" ADD CONSTRAINT "TrainingPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
