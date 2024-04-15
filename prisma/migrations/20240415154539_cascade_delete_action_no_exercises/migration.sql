-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_massId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_strengthId_fkey";

-- DropForeignKey
ALTER TABLE "ActionMass" DROP CONSTRAINT "ActionMass_currentApproachGroupId_fkey";

-- DropForeignKey
ALTER TABLE "ActionStrength" DROP CONSTRAINT "ActionStrength_currentApproachGroupId_fkey";

-- DropForeignKey
ALTER TABLE "ActionsOnMusclesAgony" DROP CONSTRAINT "ActionsOnMusclesAgony_actionId_fkey";

-- DropForeignKey
ALTER TABLE "ActionsOnMusclesStabilizer" DROP CONSTRAINT "ActionsOnMusclesStabilizer_actionId_fkey";

-- DropForeignKey
ALTER TABLE "ActionsOnMusclesSynergy" DROP CONSTRAINT "ActionsOnMusclesSynergy_actionId_fkey";

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesAgony" ADD CONSTRAINT "ActionsOnMusclesAgony_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesSynergy" ADD CONSTRAINT "ActionsOnMusclesSynergy_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesStabilizer" ADD CONSTRAINT "ActionsOnMusclesStabilizer_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_massId_fkey" FOREIGN KEY ("massId") REFERENCES "ActionMass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_strengthId_fkey" FOREIGN KEY ("strengthId") REFERENCES "ActionStrength"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionMass" ADD CONSTRAINT "ActionMass_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStrength" ADD CONSTRAINT "ActionStrength_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
