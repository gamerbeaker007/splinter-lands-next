-- CreateTable
CREATE TABLE "land_top_up_pool_run" (
    "id" SERIAL NOT NULL,
    "player" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "window_hours" DOUBLE PRECISION NOT NULL,
    "transactions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "land_top_up_pool_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "land_top_up_pool_run_player_executed_at_idx" ON "land_top_up_pool_run"("player", "executed_at" DESC);
