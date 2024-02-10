/*
  Warnings:

  - You are about to drop the column `planedTo` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `planedToStr` on the `Training` table. All the data in the column will be lost.
  - Added the required column `plannedTo` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedToStr` to the `Training` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Training" DROP COLUMN "planedTo",
DROP COLUMN "planedToStr",
ADD COLUMN     "plannedTo" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "plannedToStr" TEXT NOT NULL;
