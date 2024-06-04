-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "commonComment" TEXT,
ADD COLUMN     "completeComment" TEXT,
ADD COLUMN     "isCircuit" BOOLEAN NOT NULL DEFAULT false;
