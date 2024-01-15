-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('MASS', 'STRENGTH');

-- AlterTable
ALTER TABLE "ApproachesGroup" ADD COLUMN     "purpose" "Purpose" NOT NULL DEFAULT 'STRENGTH';
