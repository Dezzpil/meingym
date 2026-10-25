-- CreateEnum
CREATE TYPE "SorenessIntensity" AS ENUM ('NONE', 'LIGHT', 'MODERATE', 'SEVERE');

-- CreateTable
CREATE TABLE "MuscleSoreness" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "daysAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuscleSoreness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuscleSorenessEntry" (
    "id" SERIAL NOT NULL,
    "sorenessId" INTEGER NOT NULL,
    "muscleId" INTEGER NOT NULL,
    "intensity" "SorenessIntensity" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "MuscleSorenessEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuscleSoreness_trainingId_key" ON "MuscleSoreness"("trainingId");

-- CreateIndex
CREATE INDEX "MuscleSoreness_userId_createdAt_idx" ON "MuscleSoreness"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MuscleSorenessEntry_sorenessId_muscleId_key" ON "MuscleSorenessEntry"("sorenessId", "muscleId");

-- AddForeignKey
ALTER TABLE "MuscleSoreness" ADD CONSTRAINT "MuscleSoreness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleSoreness" ADD CONSTRAINT "MuscleSoreness_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleSorenessEntry" ADD CONSTRAINT "MuscleSorenessEntry_sorenessId_fkey" FOREIGN KEY ("sorenessId") REFERENCES "MuscleSoreness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleSorenessEntry" ADD CONSTRAINT "MuscleSorenessEntry_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "UserInfo" ADD COLUMN "sorenessEnabled" BOOLEAN NOT NULL DEFAULT true;
