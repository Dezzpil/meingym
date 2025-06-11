/*
  Warnings:

  - You are about to drop the column `imagePath` on the `Action` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Action" DROP COLUMN "imagePath";

-- CreateTable
CREATE TABLE "ExerciseImage" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "actionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExerciseImage" ADD CONSTRAINT "ExerciseImage_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
