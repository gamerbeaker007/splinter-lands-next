-- CreateTable
CREATE TABLE "support_donation" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "usd_value" DECIMAL(18,8) NOT NULL,
    "tx" TEXT NOT NULL,

    CONSTRAINT "support_donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_donation_tx_key" ON "support_donation"("tx");
