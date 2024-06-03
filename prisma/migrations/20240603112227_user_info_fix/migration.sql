/*
  Warnings:

  - The values [SIMPLESPLIT,FULLBODYBRIN1] on the enum `TrainingProgression` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `trainingType` on the `UserInfo` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrainingProgression_new" AS ENUM ('NONE', 'SIMPLE');
ALTER TABLE "UserInfo" ALTER COLUMN "trainingProgression" DROP DEFAULT;
ALTER TABLE "UserInfo" ALTER COLUMN "trainingProgression" TYPE "TrainingProgression_new" USING ("trainingProgression"::text::"TrainingProgression_new");
ALTER TYPE "TrainingProgression" RENAME TO "TrainingProgression_old";
ALTER TYPE "TrainingProgression_new" RENAME TO "TrainingProgression";
DROP TYPE "TrainingProgression_old";
ALTER TABLE "UserInfo" ALTER COLUMN "trainingProgression" SET DEFAULT 'NONE';
COMMIT;

-- AlterTable
ALTER TABLE "UserInfo" DROP COLUMN "trainingType";

-- DropEnum
DROP TYPE "TrainingType";
