-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "titleAr" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- Backfill new fields from legacy columns (no data loss):
-- titleAr inherits the existing activity name; startDate inherits dateParsed.
UPDATE "Activity" SET "titleAr" = "name" WHERE "titleAr" IS NULL;
UPDATE "Activity" SET "startDate" = "dateParsed" WHERE "startDate" IS NULL AND "dateParsed" IS NOT NULL;
