-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "repeatedFromId" INTEGER;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_repeatedFromId_fkey" FOREIGN KEY ("repeatedFromId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
