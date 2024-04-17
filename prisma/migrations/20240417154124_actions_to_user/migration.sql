-- AlterTable
ALTER TABLE "ActionMass" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ActionStrength" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ApproachesGroup" ALTER COLUMN "userId" SET DATA TYPE TEXT;
