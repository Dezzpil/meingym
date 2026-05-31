-- CreateTable
CREATE TABLE "ActionsOnMusclesAntagonist" (
    "muscleId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,

    CONSTRAINT "ActionsOnMusclesAntagonist_pkey" PRIMARY KEY ("actionId","muscleId")
);

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesAntagonist" ADD CONSTRAINT "ActionsOnMusclesAntagonist_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesAntagonist" ADD CONSTRAINT "ActionsOnMusclesAntagonist_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
