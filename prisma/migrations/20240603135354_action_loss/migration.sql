-- CreateTable
CREATE TABLE "ActionLoss" (
    "id" SERIAL NOT NULL,
    "currentApproachGroupId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActionLoss_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionLoss" ADD CONSTRAINT "ActionLoss_currentApproachGroupId_fkey" FOREIGN KEY ("currentApproachGroupId") REFERENCES "ApproachesGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLoss" ADD CONSTRAINT "ActionLoss_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLoss" ADD CONSTRAINT "ActionLoss_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
