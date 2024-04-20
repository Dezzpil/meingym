/*
  Warnings:

  - You are about to drop the `Weights` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Weights" DROP CONSTRAINT "Weights_userId_fkey";

-- DropTable
DROP TABLE "Weights";

-- CreateTable
CREATE TABLE "Rig" (
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Rig_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Weight" (
    "id" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Weight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rig" ADD CONSTRAINT "Rig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
