/*
  Warnings:

  - You are about to drop the `Rig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rig" DROP CONSTRAINT "Rig_userId_fkey";

-- DropTable
DROP TABLE "Rig";
