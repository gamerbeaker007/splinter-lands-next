-- Add rental_batch_size: nullable integer (null = no batch limit / all at once), default 10
ALTER TABLE "land_manager_config" ADD COLUMN "rental_batch_size" INTEGER DEFAULT 10;
