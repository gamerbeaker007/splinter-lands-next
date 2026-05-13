-- AlterTable
ALTER TABLE "land_mythic_harvest_log" ADD COLUMN     "fee_error" TEXT,
ADD COLUMN     "fee_transactions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fees_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "unpaid_fees_json" JSONB NOT NULL DEFAULT '{}';
