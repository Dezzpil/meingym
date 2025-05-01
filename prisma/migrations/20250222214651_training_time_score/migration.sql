-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "timeScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeScoredAt" TIMESTAMP(3);
