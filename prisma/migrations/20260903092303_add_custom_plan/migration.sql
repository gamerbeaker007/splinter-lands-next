-- CreateTable
CREATE TABLE "land_custom_plan" (
    "id" TEXT NOT NULL,
    "player" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_custom_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_custom_plan_item" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "from_region_uid" TEXT,
    "to_region_uid" TEXT,
    "from_resource" TEXT,
    "to_resource" TEXT,
    "amount_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "land_custom_plan_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "land_custom_plan_player_sort_order_idx" ON "land_custom_plan"("player", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "land_custom_plan_player_name_key" ON "land_custom_plan"("player", "name");

-- CreateIndex
CREATE INDEX "land_custom_plan_item_plan_id_sequence_idx" ON "land_custom_plan_item"("plan_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "land_custom_plan_item_plan_id_sequence_key" ON "land_custom_plan_item"("plan_id", "sequence");

-- AddForeignKey
ALTER TABLE "land_custom_plan_item" ADD CONSTRAINT "land_custom_plan_item_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "land_custom_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
