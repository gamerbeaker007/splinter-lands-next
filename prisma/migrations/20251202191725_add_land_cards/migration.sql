/*
  Warnings:

  - Made the column `map_name` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region_id` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tract_id` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plot_id` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region_number` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tract_number` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plot_number` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `territory` on table `deed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region_uid` on table `deed` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "deed" ALTER COLUMN "map_name" SET NOT NULL,
ALTER COLUMN "region_id" SET NOT NULL,
ALTER COLUMN "tract_id" SET NOT NULL,
ALTER COLUMN "plot_id" SET NOT NULL,
ALTER COLUMN "region_number" SET NOT NULL,
ALTER COLUMN "tract_number" SET NOT NULL,
ALTER COLUMN "plot_number" SET NOT NULL,
ALTER COLUMN "territory" SET NOT NULL,
ALTER COLUMN "region_uid" SET NOT NULL;

-- AlterTable
ALTER TABLE "staking_detail" ADD COLUMN     "card_abilities_boost" DOUBLE PRECISION,
ADD COLUMN     "card_bloodlines_boost" DOUBLE PRECISION,
ADD COLUMN     "dec_stake_needed_discount" DOUBLE PRECISION,
ADD COLUMN     "grain_food_discount" DOUBLE PRECISION,
ADD COLUMN     "has_labors_luck" BOOLEAN,
ADD COLUMN     "is_energized" BOOLEAN,
ADD COLUMN     "total_card_abilities_boost_pp" DOUBLE PRECISION,
ADD COLUMN     "total_card_bloodlines_boost_pp" DOUBLE PRECISION;
