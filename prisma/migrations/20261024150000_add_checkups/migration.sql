-- CreateEnum
CREATE TYPE "DifficultyChoice" AS ENUM ('BOOST', 'NORMAL', 'EASY');

-- AlterTable
ALTER TABLE "UserInfo" ADD COLUMN     "checkupsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEmployed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Checkup" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "sleep" INTEGER NOT NULL,
    "nutrition" INTEGER NOT NULL,
    "preWorkout" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "burnoutExhaustion" INTEGER,
    "burnoutDistance" INTEGER,
    "burnoutCognitive" INTEGER,
    "burnoutEmotional" INTEGER,
    "burnoutScore" DOUBLE PRECISION,
    "difficultyChoice" "DifficultyChoice",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Checkup_trainingId_key" ON "Checkup"("trainingId");

-- CreateIndex
CREATE INDEX "Checkup_userId_createdAt_idx" ON "Checkup"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Checkup" ADD CONSTRAINT "Checkup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkup" ADD CONSTRAINT "Checkup_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
