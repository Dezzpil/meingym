-- CreateTable
CREATE TABLE "Weights" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Weights_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "Weights" ADD CONSTRAINT "Weights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
