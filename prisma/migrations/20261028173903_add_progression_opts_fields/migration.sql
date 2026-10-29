-- AlterTable
ALTER TABLE "ProgressionStrategySimpleOpts" ADD COLUMN     "equipmentStep" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "resetMultiplier" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "strengthRepThreshold" INTEGER NOT NULL DEFAULT 3;
