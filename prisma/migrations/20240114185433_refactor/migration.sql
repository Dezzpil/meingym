/*
  Warnings:

  - You are about to drop the column `actionId` on the `ActionMass` table. All the data in the column will be lost.
  - You are about to drop the column `actionId` on the `ActionStrength` table. All the data in the column will be lost.
  - Added the required column `massId` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strengthId` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ActionMass" DROP CONSTRAINT "ActionMass_actionId_fkey";

-- DropForeignKey
ALTER TABLE "ActionStrength" DROP CONSTRAINT "ActionStrength_actionId_fkey";

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "massId" INTEGER NOT NULL,
ADD COLUMN     "strengthId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ActionMass" DROP COLUMN "actionId";

-- AlterTable
ALTER TABLE "ActionStrength" DROP COLUMN "actionId";

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_massId_fkey" FOREIGN KEY ("massId") REFERENCES "ActionMass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_strengthId_fkey" FOREIGN KEY ("strengthId") REFERENCES "ActionStrength"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
