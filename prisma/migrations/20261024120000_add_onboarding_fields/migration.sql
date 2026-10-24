-- CreateEnum
CREATE TYPE "TrainingExperience" AS ENUM ('NONE', 'LESS_THAN_1', 'ONE_TO_TWO', 'THREE_TO_FIVE', 'MORE_THAN_FIVE');

-- AlterTable
ALTER TABLE "UserInfo" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainingExperience" "TrainingExperience";

-- Mark existing users with trainings as onboarded
UPDATE "UserInfo"
SET "onboardingCompleted" = true
WHERE "userId" IN (
  SELECT DISTINCT "userId" FROM "Training"
);
