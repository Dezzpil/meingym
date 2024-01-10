-- DropForeignKey
ALTER TABLE "ApproachesGroups" DROP CONSTRAINT "ApproachesGroups_actionId_fkey";

-- AlterTable
ALTER TABLE "Actions" ADD COLUMN     "currentApproachGroupId" INTEGER;

-- AddForeignKey
ALTER TABLE "Actions" ADD CONSTRAINT "Actions_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
