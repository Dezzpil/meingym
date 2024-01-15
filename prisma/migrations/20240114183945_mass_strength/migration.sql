/*
  Warnings:

  - You are about to drop the column `currentApproachGroupId` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `purpose` on the `ApproachesGroup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_currentApproachGroupId_fkey";

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "currentApproachGroupId";

-- AlterTable
ALTER TABLE "ApproachesGroup" DROP COLUMN "purpose";

-- DropEnum
DROP TYPE "Purpose";

-- CreateTable
CREATE TABLE "ActionMass" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER NOT NULL,
    "currentApproachGroupId" INTEGER NOT NULL,

    CONSTRAINT "ActionMass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionStrength" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER NOT NULL,
    "currentApproachGroupId" INTEGER NOT NULL,

    CONSTRAINT "ActionStrength_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionMass" ADD CONSTRAINT "ActionMass_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionMass" ADD CONSTRAINT "ActionMass_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStrength" ADD CONSTRAINT "ActionStrength_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStrength" ADD CONSTRAINT "ActionStrength_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
