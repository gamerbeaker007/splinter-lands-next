-- CreateTable
CREATE TABLE "active" (
    "date" DATE NOT NULL,
    "active_based_on_pp" INTEGER NOT NULL,
    "active_based_on_in_use" INTEGER NOT NULL,

    CONSTRAINT "active_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "resource_supply" (
    "date" DATE NOT NULL,
    "resource" TEXT NOT NULL,
    "total_supply" BIGINT NOT NULL,

    CONSTRAINT "resource_supply_pkey" PRIMARY KEY ("date","resource")
);

-- CreateTable
CREATE TABLE "resource_tracking" (
    "date" DATE NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "total_harvest_pp" DOUBLE PRECISION NOT NULL,
    "total_base_pp_after_cap" DOUBLE PRECISION NOT NULL,
    "rewards_per_hour" DOUBLE PRECISION,
    "cost_per_h_grain" DOUBLE PRECISION,
    "cost_per_h_wood" DOUBLE PRECISION,
    "cost_per_h_stone" DOUBLE PRECISION,
    "cost_per_h_iron" DOUBLE PRECISION,

    CONSTRAINT "resource_tracking_pkey" PRIMARY KEY ("date","token_symbol")
);

-- CreateTable
CREATE TABLE "resource_hub_metrics" (
    "date" DATE NOT NULL,
    "id" INTEGER NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "resource_quantity" TEXT NOT NULL,
    "resource_volume" DOUBLE PRECISION NOT NULL,
    "resource_volume_1" DOUBLE PRECISION,
    "resource_volume_30" DOUBLE PRECISION,
    "resource_price" DOUBLE PRECISION NOT NULL,
    "dec_quantity" TEXT NOT NULL,
    "dec_volume" DOUBLE PRECISION NOT NULL,
    "dec_volume_1" DOUBLE PRECISION,
    "dec_volume_30" DOUBLE PRECISION,
    "total_shares" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "dec_price" DOUBLE PRECISION NOT NULL,
    "dec_usd_value" DOUBLE PRECISION NOT NULL,
    "grain_equivalent" DOUBLE PRECISION NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "resource_hub_metrics_pkey" PRIMARY KEY ("date","token_symbol")
);

-- CreateTable
CREATE TABLE "player_production_summary" (
    "player" TEXT NOT NULL,
    "total_harvest_pp" DOUBLE PRECISION NOT NULL,
    "total_base_pp_after_cap" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,
    "total_dec" DOUBLE PRECISION NOT NULL,
    "dec_grain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_wood" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_stone" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_iron" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_research" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_aura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec_sps" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "player_production_summary_pkey" PRIMARY KEY ("player")
);

-- CreateTable
CREATE TABLE "deed" (
    "deed_uid" TEXT NOT NULL,
    "map_name" TEXT,
    "region_id" INTEGER,
    "tract_id" INTEGER,
    "plot_id" INTEGER,
    "region_number" INTEGER,
    "tract_number" INTEGER,
    "plot_number" INTEGER,
    "territory" TEXT,
    "region_uid" TEXT,
    "resource_id" INTEGER,
    "resource_symbol" TEXT,
    "magic_type" TEXT,
    "stats" JSONB,
    "player" TEXT,
    "created_date" TIMESTAMP(3),
    "listed" BOOLEAN,
    "lock_days" INTEGER,
    "unlock_date" TIMESTAMP(3),
    "in_use" BOOLEAN,
    "deed_type" TEXT,
    "land_stats" JSONB,
    "region_name" TEXT,
    "market_updated_date" TIMESTAMP(3),
    "market_id" TEXT,
    "listing_price" TEXT,
    "market_listing_id" TEXT,
    "market_listing_status_id" INTEGER,
    "castle" INTEGER,
    "keep" INTEGER,
    "rarity" TEXT,
    "plot_status" TEXT,
    "hex_code" TEXT,
    "tax_rate" TEXT,
    "item_detail_id" INTEGER,
    "created_block_num" INTEGER,
    "created_tx" TEXT,
    "worksite_type" TEXT,
    "time_crystal_value" INTEGER,
    "rarity_sort_value" INTEGER,
    "is_construction" BOOLEAN,

    CONSTRAINT "deed_pkey" PRIMARY KEY ("deed_uid")
);

-- CreateTable
CREATE TABLE "worksite_detail" (
    "deed_uid" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "id" INTEGER NOT NULL,
    "project_type" TEXT,
    "project_number" INTEGER,
    "land_work_type_id" INTEGER,
    "total_time_crystals_used" DOUBLE PRECISION,
    "pp_balance" DOUBLE PRECISION,
    "start_date" TIMESTAMP(3),
    "projected_hours" DOUBLE PRECISION,
    "projected_end" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "created_date" TIMESTAMP(3),
    "last_updated_date" TIMESTAMP(3),
    "trx_id" TEXT,
    "block_num" INTEGER,
    "resource_id" INTEGER,
    "pp_required" DOUBLE PRECISION,
    "hours_to_completion" DOUBLE PRECISION,
    "elapsed_hours" DOUBLE PRECISION,
    "pp_spent" DOUBLE PRECISION,
    "grain_required" DOUBLE PRECISION,
    "wood_required" DOUBLE PRECISION,
    "stone_required" DOUBLE PRECISION,
    "iron_required" DOUBLE PRECISION,
    "is_active" BOOLEAN,
    "destroyed_date" TIMESTAMP(3),
    "is_construction" BOOLEAN,
    "last_action_time" TIMESTAMP(3),
    "hours_till_next_op" DOUBLE PRECISION,
    "next_op_allowed_date" TIMESTAMP(3),
    "pp_staked" DOUBLE PRECISION,
    "projected_amount_received" DOUBLE PRECISION,
    "work_per_hour_per_one_pp" DOUBLE PRECISION,
    "project_id" INTEGER,
    "is_harvesting" BOOLEAN,
    "is_empty" BOOLEAN,
    "is_sps_work" BOOLEAN,
    "sps_mining_reward_debt" DOUBLE PRECISION,
    "latest_sps_reward_block" DOUBLE PRECISION,
    "sps_tokens_per_block" DOUBLE PRECISION,
    "accumulated_sps_rewards_per_share_of_pool" DOUBLE PRECISION,
    "land_work_type_total_work_type_pp" DOUBLE PRECISION,
    "captured_tax_rate" DOUBLE PRECISION,
    "time_crystal_value" INTEGER,
    "project_created_date" TIMESTAMP(3),
    "worksite_type" TEXT,
    "max_tax_rate" DOUBLE PRECISION,
    "region_uid" TEXT,
    "hours_since_last_op" DOUBLE PRECISION,
    "site_efficiency" DOUBLE PRECISION,
    "is_runi_staked" BOOLEAN,
    "rewards_per_hour" DOUBLE PRECISION,
    "grain_req_per_hour" DOUBLE PRECISION,
    "segments" JSONB,
    "estimated_totem_chance" DOUBLE PRECISION,
    "resource_recipe" JSONB,
    "resource_mint_rate" DOUBLE PRECISION,

    CONSTRAINT "worksite_detail_pkey" PRIMARY KEY ("deed_uid")
);

-- CreateTable
CREATE TABLE "staking_detail" (
    "deed_uid" TEXT NOT NULL,
    "region_uid" TEXT,
    "is_powered" BOOLEAN,
    "is_runi_staked" BOOLEAN,
    "is_power_core_staked" BOOLEAN,
    "max_workers_allowed" INTEGER,
    "runi_boost" DOUBLE PRECISION,
    "title_boost" DOUBLE PRECISION,
    "totem_boost" DOUBLE PRECISION,
    "deed_status_token_boost" DOUBLE PRECISION,
    "deed_rarity_boost" DOUBLE PRECISION,
    "total_boost" DOUBLE PRECISION,
    "total_base_pp_cap" DOUBLE PRECISION,
    "total_base_pp" DOUBLE PRECISION,
    "total_base_pp_after_cap" DOUBLE PRECISION,
    "total_base_pp_after_cap_percentage" DOUBLE PRECISION,
    "total_construction_pp" DOUBLE PRECISION,
    "total_terrain_boost" DOUBLE PRECISION,
    "total_terrain_boost_pp" DOUBLE PRECISION,
    "total_dec_stake_needed" DOUBLE PRECISION,
    "total_dec_stake_in_use" DOUBLE PRECISION,
    "efficiency" DOUBLE PRECISION,
    "total_deed_rarity_boost" DOUBLE PRECISION,
    "total_deed_rarity_boost_pp" DOUBLE PRECISION,
    "total_deed_status_token_boost" DOUBLE PRECISION,
    "total_deed_status_token_boost_pp" DOUBLE PRECISION,
    "total_runi_boost" DOUBLE PRECISION,
    "total_runi_boost_pp" DOUBLE PRECISION,
    "total_title_boost" DOUBLE PRECISION,
    "total_title_boost_pp" DOUBLE PRECISION,
    "total_totem_boost" DOUBLE PRECISION,
    "total_totem_boost_pp" DOUBLE PRECISION,
    "total_boost_pp" DOUBLE PRECISION,
    "total_harvest_pp" DOUBLE PRECISION,
    "total_work_per_hour" DOUBLE PRECISION,
    "powered_worker_count" INTEGER,
    "worker_count" INTEGER,
    "manager" TEXT,
    "active_land_project_id" INTEGER,
    "has_completed_first_project" BOOLEAN,
    "red_biome_modifier" DOUBLE PRECISION,
    "blue_biome_modifier" DOUBLE PRECISION,
    "white_biome_modifier" DOUBLE PRECISION,
    "black_biome_modifier" DOUBLE PRECISION,
    "green_biome_modifier" DOUBLE PRECISION,
    "gold_biome_modifier" DOUBLE PRECISION,
    "total_dec_staked" DOUBLE PRECISION,

    CONSTRAINT "staking_detail_pkey" PRIMARY KEY ("deed_uid")
);

-- AddForeignKey
ALTER TABLE "worksite_detail" ADD CONSTRAINT "worksite_detail_deed_uid_fkey" FOREIGN KEY ("deed_uid") REFERENCES "deed"("deed_uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_detail" ADD CONSTRAINT "staking_detail_deed_uid_fkey" FOREIGN KEY ("deed_uid") REFERENCES "deed"("deed_uid") ON DELETE CASCADE ON UPDATE CASCADE;
