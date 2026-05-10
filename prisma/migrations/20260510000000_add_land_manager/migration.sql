-- CreateTable
CREATE TABLE "land_manager_config" (
    "player" TEXT NOT NULL,
    "enabled_regions" INTEGER[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_manager_config_pkey" PRIMARY KEY ("player")
);
