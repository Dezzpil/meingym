-- CreateTable
CREATE TABLE "MuscleDesc" (
    "id" SERIAL NOT NULL,
    "muscleId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuscleDesc_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MuscleDesc" ADD CONSTRAINT "MuscleDesc_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
