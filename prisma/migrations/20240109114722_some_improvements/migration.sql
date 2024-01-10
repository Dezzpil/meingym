/*
  Warnings:

  - You are about to drop the column `isBase` on the `ApproachesGroups` table. All the data in the column will be lost.
  - You are about to drop the column `weightLifted` on the `ApproachesGroups` table. All the data in the column will be lost.
  - You are about to drop the column `weightPlanned` on the `ApproachesGroups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Actions" ADD COLUMN     "alias" TEXT;

-- AlterTable
ALTER TABLE "ApproachesGroups" DROP COLUMN "isBase",
DROP COLUMN "weightLifted",
DROP COLUMN "weightPlanned";
