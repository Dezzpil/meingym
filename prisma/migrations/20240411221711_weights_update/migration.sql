/*
  Warnings:

  - You are about to drop the column `name` on the `Weights` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Weights` table. All the data in the column will be lost.
  - Added the required column `step` to the `Weights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Weights` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Weights" DROP COLUMN "name",
DROP COLUMN "value",
ADD COLUMN     "step" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
