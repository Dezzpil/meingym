/*
  Warnings:

  - You are about to drop the column `withBarbell` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `withBlocks` on the `Action` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActionRig" AS ENUM ('BLOCKS', 'BARBELL', 'OTHER');

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "withBarbell",
DROP COLUMN "withBlocks",
ADD COLUMN     "rig" "ActionRig" NOT NULL DEFAULT 'OTHER';
