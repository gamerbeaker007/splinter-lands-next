-- AlterTable
ALTER TABLE "land_manager_config"
ADD COLUMN "rental_terrain_boost_only" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "buy_terrain_boost_only" BOOLEAN NOT NULL DEFAULT false;
