-- Step 1: Add unit_id as nullable first
ALTER TABLE "companies" ADD COLUMN "unit_id" VARCHAR(255);

-- Step 2: Backfill unit_id with a guaranteed-unique value per row
--         Using the row id ensures no duplicates even if unit values were identical
UPDATE "companies"
SET "unit_id" = 'UNIT_' || CAST("id" AS TEXT);

-- Step 3: Drop the old unit column
ALTER TABLE "companies" DROP COLUMN "unit";

-- Step 4: Apply NOT NULL constraint
ALTER TABLE "companies" ALTER COLUMN "unit_id" SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "companies_unit_id_key" ON "companies"("unit_id");
