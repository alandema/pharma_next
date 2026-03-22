-- Normalize legacy role values to the new fixed role set
UPDATE "users"
SET "role" = 'user'
WHERE "role" NOT IN ('user', 'admin', 'superadmin');
