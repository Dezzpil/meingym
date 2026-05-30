-- CreateEnum
CREATE TYPE "ActionRequire" AS ENUM ('NONE', 'UPBAR', 'BENCH', 'SIMULATOR');

-- AlterEnum
ALTER TYPE "ActionRig" ADD VALUE 'KETTLEBELL';

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "require" "ActionRequire" NOT NULL DEFAULT 'NONE';
