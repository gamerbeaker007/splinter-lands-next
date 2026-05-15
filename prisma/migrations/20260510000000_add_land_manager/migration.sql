-- Combined migration: add_land_manager + land_harvest_log_unpaid_fees
--                   + split_harvest_fee_transactions + add_mythic_harvest_fees

CREATE TABLE "land_manager_config" (
    "player"                            TEXT         NOT NULL,
    "enabled_regions"                   INTEGER[]    NOT NULL,
    "make_harvestable_strategies"       TEXT[]       NOT NULL DEFAULT ARRAY['transfer', 'swap', 'buy_dec']::TEXT[],
    "fee_accepted"                      BOOLEAN      NOT NULL DEFAULT false,
    "post_harvest_strategy"             TEXT         NOT NULL DEFAULT 'accumulate',
    "post_harvest_excluded_resources"   TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "mythic_fee_accepted"               BOOLEAN      NOT NULL DEFAULT false,
    "rental_strategy"                   TEXT         NOT NULL DEFAULT 'highest_pp_per_dec',
    "rental_max_total_dec"              INTEGER      NOT NULL DEFAULT 0,
    "rental_max_dec_per_day_per_worker" INTEGER      NOT NULL DEFAULT 0,
    "rental_min_land_base_pp"           INTEGER      NOT NULL DEFAULT 0,
    "created_at"                        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_manager_config_pkey" PRIMARY KEY ("player")
);

CREATE TABLE "land_harvest_log" (
    "date"                 DATE         NOT NULL,
    "player"               TEXT         NOT NULL,
    "runs"                 INTEGER      NOT NULL DEFAULT 1,
    "resources_json"       JSONB        NOT NULL,
    "fees_json"            JSONB        NOT NULL DEFAULT '{}',
    "unpaid_fees_json"     JSONB        NOT NULL DEFAULT '{}',
    "fee_error"            TEXT,
    "harvest_transactions" TEXT[]       NOT NULL,
    "fee_transactions"     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_harvest_log_pkey" PRIMARY KEY ("date", "player")
);

CREATE TABLE "land_make_harvestable_log" (
    "date"         DATE         NOT NULL,
    "player"       TEXT         NOT NULL,
    "runs"         INTEGER      NOT NULL DEFAULT 1,
    "actions_json" JSONB        NOT NULL,
    "transactions" TEXT[]       NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_make_harvestable_log_pkey" PRIMARY KEY ("date", "player")
);

CREATE TABLE "land_post_harvest_log" (
    "date"         DATE         NOT NULL,
    "player"       TEXT         NOT NULL,
    "runs"         INTEGER      NOT NULL DEFAULT 1,
    "actions_json" JSONB        NOT NULL,
    "transactions" TEXT[]       NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_post_harvest_log_pkey" PRIMARY KEY ("date", "player")
);

CREATE TABLE "land_mythic_harvest_log" (
    "date"             DATE         NOT NULL,
    "player"           TEXT         NOT NULL,
    "runs"             INTEGER      NOT NULL DEFAULT 1,
    "results_json"     JSONB        NOT NULL,
    "transactions"     TEXT[]       NOT NULL,
    "fees_json"        JSONB        NOT NULL DEFAULT '{}',
    "unpaid_fees_json" JSONB        NOT NULL DEFAULT '{}',
    "fee_error"        TEXT,
    "fee_transactions" TEXT[]                DEFAULT ARRAY[]::TEXT[],
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_mythic_harvest_log_pkey" PRIMARY KEY ("date", "player")
);
