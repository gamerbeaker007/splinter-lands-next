-- AlterTable
ALTER TABLE "land_manager_config" ADD COLUMN     "make_harvestable_strategies" TEXT[] DEFAULT ARRAY['transfer', 'swap', 'buy_dec']::TEXT[];
