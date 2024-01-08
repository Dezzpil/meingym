-- CreateTable
CREATE TABLE "Actions" (
    "id" SERIAL NOT NULL,
    "muscleAgonyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,

    CONSTRAINT "Actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Actions" ADD CONSTRAINT "Actions_muscleAgonyId_fkey" FOREIGN KEY ("muscleAgonyId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
