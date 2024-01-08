-- CreateTable
CREATE TABLE "ApproachesGroups" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBase" BOOLEAN NOT NULL DEFAULT true,
    "actionId" INTEGER NOT NULL,
    "weightPlanned" INTEGER NOT NULL,
    "weightLifted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApproachesGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approaches" (
    "id" SERIAL NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "groupId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "countsPlanned" INTEGER NOT NULL,
    "countsLifted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Approaches_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApproachesGroups" ADD CONSTRAINT "ApproachesGroups_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approaches" ADD CONSTRAINT "Approaches_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ApproachesGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
