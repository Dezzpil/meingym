-- CreateTable
CREATE TABLE "SimilarExercises" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER NOT NULL,
    "similarActionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimilarExercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SimilarExercises_actionId_similarActionId_key" ON "SimilarExercises"("actionId", "similarActionId");

-- AddForeignKey
ALTER TABLE "SimilarExercises" ADD CONSTRAINT "SimilarExercises_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimilarExercises" ADD CONSTRAINT "SimilarExercises_similarActionId_fkey" FOREIGN KEY ("similarActionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
