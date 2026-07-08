-- AlterTable
ALTER TABLE "Action" ADD COLUMN "base" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing rows
UPDATE "Action" a
SET "base" = (
  0.7 * COALESCE((SELECT COUNT(*) FROM "ActionsOnMusclesAgony" WHERE "actionId" = a.id), 0)
  + 0.3 * COALESCE((SELECT COUNT(*) FROM "ActionsOnMusclesSynergy" WHERE "actionId" = a.id), 0)
);
