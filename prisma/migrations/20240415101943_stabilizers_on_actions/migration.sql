-- CreateTable
CREATE TABLE "ActionsOnMusclesStabilizer" (
    "muscleId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,

    CONSTRAINT "ActionsOnMusclesStabilizer_pkey" PRIMARY KEY ("actionId","muscleId")
);

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesStabilizer" ADD CONSTRAINT "ActionsOnMusclesStabilizer_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionsOnMusclesStabilizer" ADD CONSTRAINT "ActionsOnMusclesStabilizer_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
