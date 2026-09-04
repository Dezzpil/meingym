-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "durationParamLabel" TEXT,
ADD COLUMN     "durationParamUnit" TEXT,
ADD COLUMN     "isDurationBased" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProgressionStrategySimpleOpts" ADD COLUMN     "durationMaxSec" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "durationMaxSets" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "durationParamStep" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "durationSetsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "durationStepSec" INTEGER NOT NULL DEFAULT 30;
