-- AlterTable: post-harvest split + donation config
ALTER TABLE "land_manager_config"
ADD COLUMN     "post_harvest_pool_pct" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "post_harvest_sell_pct" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "donation_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "donation_pct" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "donation_daily_caps_json" JSONB NOT NULL DEFAULT '{"GRAIN":40000,"WOOD":10000,"STONE":4000,"IRON":1000}';

-- Backfill legacy post-harvest modes into the new split fields.
UPDATE "land_manager_config"
SET
	"post_harvest_strategy" = 'sell_and_pool',
	"post_harvest_sell_pct" = 100,
	"post_harvest_pool_pct" = 0
WHERE "post_harvest_strategy" = 'sell_for_dec';

UPDATE "land_manager_config"
SET
	"post_harvest_strategy" = 'sell_and_pool',
	"post_harvest_sell_pct" = 50,
	"post_harvest_pool_pct" = 50
WHERE "post_harvest_strategy" = 'add_to_pool';

-- Drop old one-time fee-confirmation flags replaced by donation config.
ALTER TABLE "land_manager_config"
DROP COLUMN "fee_accepted",
DROP COLUMN "mythic_fee_accepted";

-- Rename fee-oriented log columns to donation-oriented names for consistency.
ALTER TABLE "land_harvest_log"
RENAME COLUMN "fees_json" TO "donations_json";

ALTER TABLE "land_harvest_log"
RENAME COLUMN "unpaid_fees_json" TO "unpaid_donations_json";

ALTER TABLE "land_harvest_log"
RENAME COLUMN "fee_error" TO "donation_error";

ALTER TABLE "land_harvest_log"
RENAME COLUMN "fee_transactions" TO "donation_transactions";

ALTER TABLE "land_mythic_harvest_log"
RENAME COLUMN "fees_json" TO "donations_json";

ALTER TABLE "land_mythic_harvest_log"
RENAME COLUMN "unpaid_fees_json" TO "unpaid_donations_json";

ALTER TABLE "land_mythic_harvest_log"
RENAME COLUMN "fee_error" TO "donation_error";

ALTER TABLE "land_mythic_harvest_log"
RENAME COLUMN "fee_transactions" TO "donation_transactions";
