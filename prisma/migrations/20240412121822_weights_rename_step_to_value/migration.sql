/*
  Warnings:

  - You are about to drop the column `step` on the `Weights` table. All the data in the column will be lost.
  - Added the required column `value` to the `Weights` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Weights" DROP COLUMN "step",
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;
