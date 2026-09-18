-- Custom Plan names are capped at 40 chars in the UI and the server actions
-- (MAX_CUSTOM_PLAN_NAME_LENGTH); enforce the same bound in the database.

-- Defensive: any row predating the server-side check would abort the ALTER.
UPDATE "land_custom_plan"
  SET "name" = left("name", 40)
  WHERE length("name") > 40;

ALTER TABLE "land_custom_plan"
  ALTER COLUMN "name" TYPE VARCHAR(40);
