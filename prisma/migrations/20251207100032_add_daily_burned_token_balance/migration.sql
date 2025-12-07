-- CreateTable
CREATE TABLE "daily_burned_token_balance" (
    "date" DATE NOT NULL,
    "player" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "balance" DECIMAL(30,6) NOT NULL,

    CONSTRAINT "daily_burned_token_balance_pkey" PRIMARY KEY ("date","player","token")
);
