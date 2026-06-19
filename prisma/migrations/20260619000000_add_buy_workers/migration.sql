-- AlterTable: buy ("purchase") workflow config, fully separate from rental config
ALTER TABLE "land_manager_config"
  ADD COLUMN "buy_strategy"           TEXT    NOT NULL DEFAULT 'highest_pp_per_dec',
  ADD COLUMN "buy_max_total_dec"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "buy_max_dec_per_worker" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "buy_min_land_base_pp"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "buy_min_foil"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "buy_batch_size"         INTEGER NOT NULL DEFAULT 10;

-- Rename the rental log into a combined worker log covering rental + purchase.
ALTER TABLE "land_rental_log" RENAME TO "land_worker_log";
ALTER TABLE "land_worker_log" RENAME CONSTRAINT "land_rental_log_pkey" TO "land_worker_log_pkey";
ALTER TABLE "land_worker_log" RENAME COLUMN "total_dec" TO "rent_total_dec";

ALTER TABLE "land_worker_log"
  ADD COLUMN "bought_count"          INTEGER          NOT NULL DEFAULT 0,
  ADD COLUMN "buy_total_dec"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "buy_total_usd"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "purchase_transactions" TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[];
