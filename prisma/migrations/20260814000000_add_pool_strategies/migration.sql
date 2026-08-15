-- Make Harvestable: the new "pool" strategy (withdraw matured liquidity) becomes
-- the cheapest first choice for new players.
ALTER TABLE "land_manager_config"
    ALTER COLUMN "make_harvestable_strategies"
    SET DEFAULT ARRAY['pool', 'transfer', 'swap', 'buy_dec']::TEXT[];

-- Top Up Pools: ordered preferred/fallback strategy list.
ALTER TABLE "land_manager_config"
    ADD COLUMN "top_up_pool_strategies" TEXT[] NOT NULL
        DEFAULT ARRAY['use_owned_dec', 'swap_resource', 'sell_resource', 'buy_resources']::TEXT[];
