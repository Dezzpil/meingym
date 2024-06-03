-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('SPLIT', 'FULLBODY');

-- CreateEnum
CREATE TYPE "TrainingProgression" AS ENUM ('NONE', 'SIMPLESPLIT', 'FULLBODYBRIN1');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "UserInfo" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sex" "Sex" NOT NULL DEFAULT 'MALE',
    "height" INTEGER NOT NULL DEFAULT 175,
    "trainingType" "TrainingType" NOT NULL DEFAULT 'SPLIT',
    "trainingProgression" "TrainingProgression" NOT NULL DEFAULT 'NONE',
    "trainingProgressionParams" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserInfo" ADD CONSTRAINT "UserInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
