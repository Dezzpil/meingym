-- CreateEnum
CREATE TYPE "PersonalRecordType" AS ENUM ('MAX_WEIGHT', 'MAX_VOLUME');

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" INTEGER NOT NULL,
    "purpose" "Purpose" NOT NULL,
    "type" "PersonalRecordType" NOT NULL,
    "isAllTime" BOOLEAN NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER,
    "trainingId" INTEGER NOT NULL,
    "trainingExerciseId" INTEGER NOT NULL,
    "periodId" INTEGER,
    "achievedAt" TIMESTAMP(3) NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "previousTrainingId" INTEGER,
    "previousAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_actionId_purpose_type_achievedAt_idx" ON "PersonalRecord"("userId", "actionId", "purpose", "type", "achievedAt" DESC);

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_trainingId_idx" ON "PersonalRecord"("userId", "trainingId");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_achievedAt_idx" ON "PersonalRecord"("userId", "achievedAt" DESC);

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TrainingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
