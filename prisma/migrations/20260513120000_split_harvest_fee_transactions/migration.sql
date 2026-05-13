-- Split tx history into the two phases. Rename preserves existing harvest
-- tx data; the new fee column starts empty.
ALTER TABLE "land_harvest_log" RENAME COLUMN "transactions" TO "harvest_transactions";
ALTER TABLE "land_harvest_log" ADD COLUMN "fee_transactions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
