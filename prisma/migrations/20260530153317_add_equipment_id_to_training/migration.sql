-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "equipmentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
