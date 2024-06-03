-- AlterEnum
ALTER TYPE "Purpose" ADD VALUE 'LOSS';

-- AlterTable
ALTER TABLE "UserInfo" ADD COLUMN     "purpose" "Purpose" NOT NULL DEFAULT 'STRENGTH';
