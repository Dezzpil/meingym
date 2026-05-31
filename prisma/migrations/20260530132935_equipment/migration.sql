-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentRequire" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "type" "ActionRequire" NOT NULL,

    CONSTRAINT "EquipmentRequire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentRig" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "type" "ActionRig" NOT NULL,
    "minWeight" DECIMAL(5,2) NOT NULL,
    "step" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "EquipmentRig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentRequire_equipmentId_type_key" ON "EquipmentRequire"("equipmentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentRig_equipmentId_type_key" ON "EquipmentRig"("equipmentId", "type");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentRequire" ADD CONSTRAINT "EquipmentRequire_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentRig" ADD CONSTRAINT "EquipmentRig_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
