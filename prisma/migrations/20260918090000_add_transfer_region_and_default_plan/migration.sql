-- Post-Harvest "Transfer to a Region": destination region for the strategy.
ALTER TABLE "land_manager_config" ADD COLUMN "post_harvest_transfer_region_uid" TEXT;

-- Custom Plans: the plan preselected when the Custom Plan dialog opens.
ALTER TABLE "land_custom_plan" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- At most one default plan per player.
CREATE UNIQUE INDEX "land_custom_plan_player_default_key"
  ON "land_custom_plan" ("player")
  WHERE "is_default";
