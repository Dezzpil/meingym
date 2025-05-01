-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "periodId" INTEGER;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TrainingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
