/*
  Warnings:

  - You are about to drop the column `massId` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `strengthId` on the `Action` table. All the data in the column will be lost.
  - Added the required column `actionId` to the `ActionMass` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ActionMass` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `actionId` to the `ActionStrength` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ActionStrength` required. This step will fail if there are existing NULL values in that column.
  - Made the column `actionId` on table `ApproachesGroup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `ApproachesGroup` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_massId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_strengthId_fkey";

-- DropForeignKey
ALTER TABLE "Approach" DROP CONSTRAINT "Approach_groupId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExercise" DROP CONSTRAINT "TrainingExercise_actionId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExercise" DROP CONSTRAINT "TrainingExercise_approachGroupId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExercise" DROP CONSTRAINT "TrainingExercise_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExerciseExecution" DROP CONSTRAINT "TrainingExerciseExecution_approachId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingExerciseExecution" DROP CONSTRAINT "TrainingExerciseExecution_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "Weights" DROP CONSTRAINT "Weights_userId_fkey";

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "massId",
DROP COLUMN "strengthId";

-- AlterTable
ALTER TABLE "ActionMass" ADD COLUMN     "actionId" INTEGER NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ActionStrength" ADD COLUMN     "actionId" INTEGER NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ApproachesGroup" ALTER COLUMN "actionId" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ActionMass" ADD CONSTRAINT "ActionMass_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionMass" ADD CONSTRAINT "ActionMass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStrength" ADD CONSTRAINT "ActionStrength_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStrength" ADD CONSTRAINT "ActionStrength_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproachesGroup" ADD CONSTRAINT "ApproachesGroup_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproachesGroup" ADD CONSTRAINT "ApproachesGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approach" ADD CONSTRAINT "Approach_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ApproachesGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_approachGroupId_fkey" FOREIGN KEY ("approachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecution" ADD CONSTRAINT "TrainingExerciseExecution_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseExecution" ADD CONSTRAINT "TrainingExerciseExecution_approachId_fkey" FOREIGN KEY ("approachId") REFERENCES "Approach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weights" ADD CONSTRAINT "Weights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
