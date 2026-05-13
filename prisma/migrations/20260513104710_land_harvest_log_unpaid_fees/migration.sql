-- AlterTable
ALTER TABLE "land_harvest_log" ADD COLUMN     "fee_error" TEXT,
ADD COLUMN     "unpaid_fees_json" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "transactions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "land_make_harvestable_log" ALTER COLUMN "actions_json" DROP DEFAULT,
ALTER COLUMN "transactions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "land_mythic_harvest_log" ALTER COLUMN "results_json" DROP DEFAULT,
ALTER COLUMN "transactions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "land_post_harvest_log" ALTER COLUMN "actions_json" DROP DEFAULT,
ALTER COLUMN "transactions" DROP DEFAULT;
