-- AlterTable
ALTER TABLE "ApproachesGroups" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mean" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "sum" INTEGER NOT NULL DEFAULT 0;