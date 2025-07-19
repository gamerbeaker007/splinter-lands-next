-- CreateTable
CREATE TABLE "player_trade_hub_position" (
    "date" DATE NOT NULL,
    "player" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "total_fees_earned_dec" DOUBLE PRECISION NOT NULL,
    "total_fees_earned_resource" DOUBLE PRECISION NOT NULL,
    "fees_earned_dec_1" DOUBLE PRECISION NOT NULL,
    "fees_earned_resource_1" DOUBLE PRECISION NOT NULL,
    "fees_earned_dec_30" DOUBLE PRECISION NOT NULL,
    "fees_earned_resource_30" DOUBLE PRECISION NOT NULL,
    "share_percentage" DOUBLE PRECISION NOT NULL,
    "resource_quantity" DOUBLE PRECISION NOT NULL,
    "dec_quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "player_trade_hub_position_pkey" PRIMARY KEY ("date","player","token")
);
