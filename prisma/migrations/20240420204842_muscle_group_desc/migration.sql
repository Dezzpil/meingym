-- CreateTable
CREATE TABLE "MuscleGroupDesc" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "MuscleGroupDesc_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MuscleGroupDesc" ADD CONSTRAINT "MuscleGroupDesc_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MuscleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
