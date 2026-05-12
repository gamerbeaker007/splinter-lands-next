CREATE TABLE "land_manager_config" (
    "player"                      TEXT      NOT NULL,
    "enabled_regions"             INTEGER[] NOT NULL,
    "make_harvestable_strategies" TEXT[]    NOT NULL DEFAULT ARRAY['transfer', 'swap', 'buy_dec']::TEXT[],
    "fee_accepted"                BOOLEAN   NOT NULL DEFAULT false,
    "created_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_manager_config_pkey" PRIMARY KEY ("player")
);

CREATE TABLE "land_harvest_log" (
    "date"           DATE         NOT NULL,
    "player"         TEXT         NOT NULL,
    "runs"           INTEGER      NOT NULL DEFAULT 1,
    "resources_json" JSONB        NOT NULL,
    "fees_json"      JSONB        NOT NULL DEFAULT '{}',
    "transactions"   TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_harvest_log_pkey" PRIMARY KEY ("date", "player")
);

CREATE TABLE "land_make_harvestable_log" (
    "date"         DATE         NOT NULL,
    "player"       TEXT         NOT NULL,
    "runs"         INTEGER      NOT NULL DEFAULT 1,
    "actions_json" JSONB        NOT NULL DEFAULT '[]',
    "transactions" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_make_harvestable_log_pkey" PRIMARY KEY ("date", "player")
);

ALTER TABLE "land_manager_config" ADD COLUMN IF NOT EXISTS "post_harvest_strategy" TEXT NOT NULL DEFAULT 'accumulate';

CREATE TABLE IF NOT EXISTS "land_post_harvest_log" (
    "date"         DATE         NOT NULL,
    "player"       TEXT         NOT NULL,
    "runs"         INTEGER      NOT NULL DEFAULT 1,
    "actions_json" JSONB        NOT NULL DEFAULT '[]',
    "transactions" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "land_post_harvest_log_pkey" PRIMARY KEY ("date", "player")
);

ALTER TABLE "land_manager_config" ADD COLUMN IF NOT EXISTS "mythic_fee_accepted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "land_mythic_harvest_log" (
    "date"         DATE         NOT NULL,
    "player"       TEXT         NOT NULL,
    "runs"         INTEGER      NOT NULL DEFAULT 1,
    "results_json" JSONB        NOT NULL DEFAULT '[]',
    "transactions" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "land_mythic_harvest_log_pkey" PRIMARY KEY ("date", "player")
);
