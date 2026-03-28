-- Drop deprecated professional profile fields in favor of council-only model
ALTER TABLE "users"
DROP COLUMN "professional_type",
DROP COLUMN "specialties";
