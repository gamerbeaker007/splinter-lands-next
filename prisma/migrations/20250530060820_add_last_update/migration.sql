-- CreateTable
CREATE TABLE "last_update" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "last_update_pkey" PRIMARY KEY ("id")
);
