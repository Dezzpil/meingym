-- CreateTable
CREATE TABLE "MuscleImage" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "muscleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuscleImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MuscleImage" ADD CONSTRAINT "MuscleImage_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
