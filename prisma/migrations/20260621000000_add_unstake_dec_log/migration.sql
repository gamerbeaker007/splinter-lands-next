CREATE TABLE "land_unstake_dec_log" (
    "date"            DATE             NOT NULL,
    "player"          TEXT             NOT NULL,
    "runs"            INTEGER          NOT NULL DEFAULT 1,
    "succeeded_json"  JSONB            NOT NULL DEFAULT '{}',
    "failed_json"     JSONB            NOT NULL DEFAULT '{}',
    "total_succeeded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_failed"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "error"           TEXT,
    "transactions"    TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at"      TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "land_unstake_dec_log_pkey" PRIMARY KEY ("date", "player")
);
